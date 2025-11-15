import type { Table } from "../dbc.ts";
import { hydrater, SpellType, type AnySpell } from "./internal/types.ts";
import type { SpellCategories } from "./charges.ts";
import classMask, { matchesClassMask } from "./classMask.ts";
import label from "./label.ts";

// as i learn more about the effect structure, i think this needs some refactoring...

export interface SpellEffect {
  sourceSpellId: number;
  aura: number;
  misc0: number;
  misc1: number;
  basePoints: number;
  pointModifiers?: Record<number, number>;
  period?: number;
  triggeredSpell?: number;
}

export interface EffectsOutput {
  effects: SpellEffect[];
}

export interface SpellEffectRaw {
  SpellID: number;
  EffectIndex: number;
  EffectSpellClassMask_0: number;
  EffectSpellClassMask_1: number;
  EffectSpellClassMask_2: number;
  EffectSpellClassMask_3: number;
  EffectAura: number;
  EffectAuraPeriod: number;
  EffectMiscValue_0: number;
  EffectMiscValue_1: number;
  EffectBasePointsF: number;
  EffectBasePoints: number;
  EffectTriggerSpell: number;
}

/**
 * Populate the effects that are applied to a spell by other spells.
 *
 * There are multiple ways for a spell to indicate that its effects modify another spell. The three most common are:
 * - By class mask. See `classMask` and `matchesClassMask` for details.
 * - By label. See `label` for details.
 * - By category. "Category" generally means a charge, cooldown, or GCD category. An effect may modify the entire category.
 *
 * Effects may additionally be modified by other effects. This hydrater goes 1 layer deep to capture those second-order effects. There is no guarantee that this captures everything.
 *
 * This will include all effects found by the above lookup methods. It does not attempt to interpret the effects.
 *
 * See `gcd` for example usage.
 */
export default hydrater({
  name: "effects",
  dependencies: { classMask, label },
  tables: [
    { name: "SpellEffect", key: "SpellID" },
    { name: "SpellCategories", key: "SpellID" },
  ],
  hydrate(dbc, input, spellList): EffectsOutput {
    const spellEffect = dbc.getTable<SpellEffectRaw, "SpellID">(
      "SpellEffect",
      "SpellID",
    );
    const spellCategories = dbc.getTable<SpellCategories>(
      "SpellCategories",
      "SpellID",
    );
    const category = spellCategories.getFirst(input.id);

    const outputEffects: SpellEffect[] = [];
    for (const spell of spellList.values()) {
      const effects = spellEffect.getAll(spell.id);
      if (!effects) {
        continue;
      }
      for (const effect of effects) {
        if (
          !matchesClassMask(input, [
            effect.EffectSpellClassMask_0,
            effect.EffectSpellClassMask_1,
            effect.EffectSpellClassMask_2,
            effect.EffectSpellClassMask_3,
          ]) &&
          !matchesCategory(effect, category)
        ) {
          continue;
        }

        const modifiers = pointModifiers(spell, effect, spellEffect, spellList);

        const period =
          effect.EffectAuraPeriod > 0 ? effect.EffectAuraPeriod : undefined;
        const triggeredSpell =
          effect.EffectTriggerSpell > 0 ? effect.EffectTriggerSpell : undefined;

        outputEffects.push({
          sourceSpellId: spell.id,
          aura: effect.EffectAura,
          basePoints:
            effect.EffectBasePointsF === 0
              ? effect.EffectBasePoints
              : effect.EffectBasePointsF,
          misc0: effect.EffectMiscValue_0,
          misc1: effect.EffectMiscValue_1,
          pointModifiers: modifiers,
          period,
          triggeredSpell,
        });
      }
    }
    return {
      effects: outputEffects,
    };
  },
});

function matchesCategory(
  effect: SpellEffectRaw,
  category?: SpellCategories,
): boolean {
  if (!category) {
    return false;
  }
  const categoryType = effectCategoryTypes[effect.EffectAura];
  if (!categoryType) {
    return false;
  }

  return category[categoryType] === effect.EffectMiscValue_0;
}

// see: https://github.com/Marlamin/wow.tools.local/blob/d9872d652157b720a24cc7db96543d01a7d50b29/wwwroot/js/enums.js#L1698
export const EffectType = {
  PERIODIC_TRIGGER_SPELL: 23,
  APPLY_GLYPH: 74,
  ADD_FLAT_MODIFIER: 107,
  ADD_PCT_MODIFIER: 108,
  ADD_FLAT_MODIFIER_BY_SPELL_LABEL: 219,
  OVERRIDE_ACTIONBAR_SPELLS: 332,
  OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED: 333,
  MOD_MAX_CHARGES: 411,
  MOD_COOLDOWN_BY_HASTE: 416,
  MOD_GCD_BY_HASTE: 417,
  CHARGE_RECOVERY_MULTIPLIER: 454,
  CHARGE_RECOVERY_BY_HASTE: 457,
};

export const EffectMiscValue = {
  EffectIndex0: 3,
  Cooldown: 11,
  EffectIndex1: 12,
  StartCooldown: 21,
  EffectIndex2: 23,
  EffectIndex3: 32,
  EffectIndex4: 33,
};

function pointModifiers(
  spell: AnySpell & { label?: number[] },
  effect: SpellEffectRaw,
  spellEffect: Table<SpellEffectRaw, "SpellID">,
  spellList: Map<number, AnySpell>,
): Record<number, number> {
  if (!spell.label) {
    return [];
  }

  const modifiers: Record<number, number> = {};

  for (const otherSpell of spellList.values()) {
    const effects = spellEffect.getAll(otherSpell.id);
    for (const maybeModifier of effects) {
      if (
        maybeModifier.EffectAura ===
          EffectType.ADD_FLAT_MODIFIER_BY_SPELL_LABEL &&
        // effectIndexLookup will be undefined if this isn't actually modifying the effect
        effectIndexLookup[maybeModifier.EffectMiscValue_0] ===
          effect.EffectIndex &&
        spell.label?.includes(maybeModifier.EffectMiscValue_1)
      ) {
        modifiers[otherSpell.id] =
          maybeModifier.EffectBasePointsF === 0
            ? maybeModifier.EffectBasePoints
            : maybeModifier.EffectBasePointsF;
      }
    }
  }
  return modifiers;
}

// manually built from wago.tools data
const effectIndexLookup: Record<number, number> = {
  [EffectMiscValue.EffectIndex0]: 0,
  [EffectMiscValue.EffectIndex1]: 1,
  [EffectMiscValue.EffectIndex2]: 2,
  [EffectMiscValue.EffectIndex3]: 3,
  [EffectMiscValue.EffectIndex4]: 4,
};

const effectCategoryTypes: Record<number, keyof SpellCategories> = {
  [EffectType.MOD_MAX_CHARGES]: "ChargeCategory",
  [EffectType.CHARGE_RECOVERY_MULTIPLIER]: "ChargeCategory",
  [EffectType.CHARGE_RECOVERY_BY_HASTE]: "ChargeCategory",
};

export type Modifier<T> = Partial<T> & {
  /** The list of spells which must ALL be known to enable this modifier. */
  requiredSpells: number[];
};

export type WithModifiers<T> = T & {
  modifiers?: Modifier<T>[];
};

function isBaselinePassiveSpell(
  spellList: Map<number, AnySpell>,
  spellId: number,
): boolean {
  const spell = spellList.get(spellId);
  return (
    spell?.type === SpellType.Baseline &&
    "passive" in spell &&
    Boolean(spell?.passive)
  );
}

export interface EffectAccumulator<T> {
  (
    acc: T | Partial<T> | undefined,
    effect: SpellEffect,
  ): T | Partial<T> | undefined;
}

/**
 * Process the effects applied to a spell, producing an object that has:
 *
 * - Top-level: the properties from `T`, modified by any baseline spells.
 * - Modifiers: a list of modifiers, listing required spells for the modifier to take effect as well as the properties to be merged into the top-level object.
 *
 * ## Example
 *
 * To generate GCD information, the `gcd` hydrater depends on the `effects` hydrater, then calls `effectWithModifiers`:
 *
 * ```ts
 * const result = effectWithModifiers(spellList, input, { duration: baseDuration, hasted: defaultHasted }, accumulator);
 * ```
 *
 * `result` would look something like:
 *
 * ```ts
 * {
 *   duration: 1500,
 *   hasted: true,
 *   modifiers: [
 *     {
 *       requiredSpells: [1234, 5678],
 *       duration: -500,
 *     }
 *   ]
 * }
 * ```
 *
 * This indicates that the spell gcd with the baseline spells in `spellList` is 1.5s (hasted), and that the GCD
 * is reduced by 0.5s if spells `1234` and `5678` are *both* known.
 *
 */
export function effectWithModifiers<T>(
  spellList: Map<number, AnySpell>,
  spell: AnySpell & EffectsOutput,
  baselineValue: T,
  accumulateEffectValue: EffectAccumulator<T>,
): WithModifiers<T> | undefined {
  const effectsWithModifiers = spell.effects.flatMap((effect) => {
    const result = [{ requires: [effect.sourceSpellId], effect }];
    if (effect.pointModifiers) {
      for (const [extraSpell, pointModifier] of Object.entries(
        effect.pointModifiers,
      )) {
        result.push({
          requires: [effect.sourceSpellId, Number(extraSpell)],
          effect: {
            ...effect,
            // not recursively resolving these
            pointModifiers: undefined,
            basePoints: pointModifier,
          },
        });
      }
    }
    return result;
  });
  const baselineEffects = effectsWithModifiers
    .filter(({ requires }) =>
      requires.every((id) => isBaselinePassiveSpell(spellList, id)),
    )
    .map(({ effect }) => effect);

  const base = baselineEffects.reduce(
    (val: T, effect: SpellEffect) => accumulateEffectValue(val, effect) as T,
    baselineValue,
  );

  const modifierEffectsBySource: Map<string, SpellEffect[]> =
    effectsWithModifiers
      .filter(({ requires }) =>
        requires.some((id) => !isBaselinePassiveSpell(spellList, id)),
      )
      .reduce((map, { requires, effect }) => {
        const key = requires.join(",");
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(effect);
        return map;
      }, new Map());

  const modifiers: Modifier<T>[] = Array.from(modifierEffectsBySource.entries())
    .map(([key, effects]): Modifier<T> | undefined => {
      const requires = key.split(",").map(Number);
      const result = effects.reduce(
        (val: Partial<T> | undefined, effect: SpellEffect) =>
          accumulateEffectValue(val, effect),
        undefined,
      );
      if (!result) {
        return undefined;
      }

      return {
        ...result,
        requiredSpells: requires,
      };
    })
    .filter((modifier) => modifier !== undefined);

  if (modifiers.length > 0) {
    return { ...base, modifiers };
  }
  return base as WithModifiers<T>;
}

export function applyModifiers<T>(
  effect: WithModifiers<T>,
  isKnownSpell: (spellId: number) => boolean,
): T {
  const { modifiers, ...base } = effect;

  if (!modifiers) {
    return base as T;
  }

  const result = base as T;

  for (const { requiredSpells, ...modifier } of modifiers) {
    if (requiredSpells.some((spellId) => !isKnownSpell(spellId))) {
      // one of the required spells is not known, do not apply the modifier.
      continue;
    }

    // modifier is known, merge into base
    let key: keyof T;
    for (key in modifier) {
      const value = (modifier as T)[key];

      if (typeof value === "number") {
        // ugly casting to work around TS inability to infer transitive relationship here
        result[key] = (value + ((result[key] as number) ?? 0)) as T[typeof key];
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

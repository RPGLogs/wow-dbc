import type { Table } from "../dbc.ts";
import { hydrater, SpellType, type BaseSpell } from "../types.ts";
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

interface Output {
  effects: SpellEffect[];
}

interface SpellEffectRaw {
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
  EffectTriggerSpell: number;
}

export default hydrater({
  name: "effects",
  dependencies: { classMask, label },
  tables: [
    { name: "SpellEffect", key: "SpellID" },
    { name: "SpellCategories", key: "SpellID" },
  ],
  hydrate(dbc, input, spellList): Output {
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
          basePoints: effect.EffectBasePointsF,
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
export enum EffectType {
  PERIODIC_TRIGGER_SPELL = 23,
  ADD_FLAT_MODIFIER = 107,
  ADD_FLAT_MODIFIER_BY_SPELL_LABEL = 219,
  MOD_MAX_CHARGES = 411,
  MOD_COOLDOWN_BY_HASTE = 416,
  MOD_GCD_BY_HASTE = 417,
  CHARGE_RECOVERY_MULTIPLIER = 454,
}

export enum EffectMiscValue {
  EffectIndex0 = 3,
  Cooldown = 11,
  EffectIndex1 = 12,
  StartCooldown = 21,
  EffectIndex2 = 23,
  EffectIndex3 = 32,
  EffectIndex4 = 33,
}

function pointModifiers(
  spell: BaseSpell & { label?: number[] },
  effect: SpellEffectRaw,
  spellEffect: Table<SpellEffectRaw, "SpellID">,
  spellList: Map<number, BaseSpell>,
): Record<number, number> {
  if (!spell.label) {
    return [];
  }

  const modifiers = {};

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
        modifiers[otherSpell.id] = maybeModifier.EffectBasePointsF;
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
};

export type Modifier<T> = Partial<T> & {
  requiredSpells: number[];
};

export type WithModifiers<T> = T & {
  modifiers?: Modifier<T>[];
};

function isBaselineSpell(
  spellList: Map<number, BaseSpell>,
  spellId: number,
): boolean {
  const spell = spellList.get(spellId);
  return spell?.type === SpellType.Class || spell?.type === SpellType.Spec;
}

export function effectWithModifiers<T>(
  spellList: Map<number, BaseSpell>,
  spell: BaseSpell & Output,
  baselineValue: T,
  accumulateEffectValue: (
    acc: T | undefined,
    effect: SpellEffect,
  ) => T | undefined,
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
      requires.every((id) => isBaselineSpell(spellList, id)),
    )
    .map(({ effect }) => effect);

  const base = baselineEffects.reduce(accumulateEffectValue, baselineValue);

  const modifierEffectsBySource: Map<string, SpellEffect[]> =
    effectsWithModifiers
      .filter(({ requires }) =>
        requires.some((id) => !isBaselineSpell(spellList, id)),
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
      const result = effects.reduce(accumulateEffectValue, undefined);
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
  return base;
}

import { hydrater } from "./internal/types.ts";
import passive from "./passive.ts";
import effects, {
  EffectMiscValue,
  EffectType,
  effectWithModifiers,
  type SpellEffect,
  type WithModifiers,
} from "./effects.ts";

interface Output {
  gcd?: WithModifiers<Gcd>;
}

interface Gcd {
  duration: number;
  hasted: boolean;
}

interface SpellCategories {
  SpellID: number;
  DefenseType: number;
  StartRecoveryCategory: number;
}

interface SpellCooldowns {
  SpellID: number;
  RecoveryTime: number;
  StartRecoveryTime: number;
}

interface SpellMisc {
  SpellID: number;
  Attributes_0: number;
}

/**
 * Retrieve the global cooldown information for a spell. The default global cooldown is applied via category 133. Virtually all spells have this category, or category 0 (indicating an off-gcd spell).
 *
 * Haste is not applied by default to most spells that use weapons. However, effects may cause those spells to have hasted GCDs. Conventionally, there is a "spec aura" that applies an effect to haste all GCDs for melee/phys ranged specs with hasted GCDs, such as Death Knights or Warriors.
 *
 * Haste *is* applied by default to spells that do not use weapons, unless they have the "Is Ability" flag in `SpellMisc`, which seems to mostly be used for unarmed "attacks" like Feral/Guardian Druid spells. Effects may override this exception.
 */
export default hydrater({
  name: "gcd",
  tables: [
    { name: "SpellCategories", key: "SpellID" },
    { name: "SpellCooldowns", key: "SpellID" },
    { name: "SpellMisc", key: "SpellID" },
  ],
  dependencies: { effects, passive },
  hydrate(dbc, input, spellList): Output {
    if (input.passive) {
      return {};
    }

    const spellCategories = dbc.getTable<SpellCategories>(
      "SpellCategories",
      "SpellID",
    );
    const category = spellCategories.getFirst(input.id);
    if (!category || category.StartRecoveryCategory !== GCD_CATEGORY) {
      return {};
    }
    const spellCooldown = dbc.getTable<SpellCooldowns>(
      "SpellCooldowns",
      "SpellID",
    );
    const cooldown = spellCooldown.getFirst(input.id);

    const spellMisc = dbc.getTable<SpellMisc>("SpellMisc", "SpellID");
    const misc = spellMisc.getFirst(input.id);

    const attr0 = misc?.Attributes_0 ?? 0;
    const isMeleeOrRangedOrAbility =
      category.DefenseType === DefenseType.Melee ||
      category.DefenseType === DefenseType.Ranged ||
      (attr0 & IS_ABILITY_FLAG) > 0 ||
      (attr0 & USES_RANGED_WEAPON_FLAG) > 0;

    const defaultHasted = !isMeleeOrRangedOrAbility;

    const baseGcd =
      cooldown && cooldown.StartRecoveryTime > 0
        ? cooldown.StartRecoveryTime
        : BASE_GCD;

    const gcd = effectWithModifiers<Gcd>(
      spellList,
      input,
      { duration: baseGcd, hasted: defaultHasted },
      (acc, effect) => {
        const duration = effectGcdReduction(effect, acc?.duration ?? baseGcd);
        const hasted = hastesGcd(effect);

        if (!hasted && !duration) {
          return acc;
        }

        return {
          duration: (acc?.duration ?? 0) - (duration ?? 0),
          hasted: Boolean(acc?.hasted) || hasted,
        };
      },
    );

    return {
      gcd,
    };
  },
});

const BASE_GCD = 1500;
const GCD_CATEGORY = 133;

function effectGcdReduction(effect: SpellEffect, baseDuration: number): number {
  if (
    effect.aura === EffectType.ADD_FLAT_MODIFIER &&
    effect.misc0 === EffectMiscValue.StartCooldown
  ) {
    // flat GCD reduction. yay magic constants
    return -effect.basePoints;
  }

  // TODO: not sure when  percentages are resolved. for now, this is simplest
  if (
    effect.aura === EffectType.ADD_PCT_MODIFIER &&
    effect.misc0 === EffectMiscValue.StartCooldown
  ) {
    return -(effect.basePoints / 100) * baseDuration;
  }

  return 0;
}

function hastesGcd(effect: SpellEffect): boolean {
  return effect.aura === EffectType.MOD_GCD_BY_HASTE;
}

const DefenseType = {
  Melee: 2,
  Ranged: 3,
};
const IS_ABILITY_FLAG = 0x10;
const USES_RANGED_WEAPON_FLAG = 0x2;

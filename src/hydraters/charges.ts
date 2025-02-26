import { hydrater } from "./internal/types.ts";
import effects, {
  EffectType,
  effectWithModifiers,
  type WithModifiers,
} from "./effects.ts";
import passive from "./passive.ts";
import type { Cooldown } from "./cooldown.ts";

interface Output {
  charges?: WithModifiers<MaxCharges>;
  cooldown?: WithModifiers<Cooldown>;
}

interface MaxCharges {
  max: number;
}

interface SpellCategory {
  ID: number;
  MaxCharges: number;
  ChargeRecoveryTime: number;
}

export interface SpellCategories {
  SpellID: number;
  ChargeCategory: number;
}

/**
 * Load the charges for a spell. A spell with charges **does not** have a normal cooldown, but *may* have a GCD.
 *
 * Charges are implemented via "categories". A spell may have a `ChargeCategory` which defines the number of charges and the default charge cooldown. Other spells
 * may share this category, in which case the spells *share charges.*
 */
export default hydrater({
  name: "charges",
  tables: [
    { name: "SpellCategory", key: "ID" },
    { name: "SpellCategories", key: "SpellID" },
  ],
  dependencies: { passive, effects },
  hydrate(dbc, input, spellList): Output {
    if (input.passive) {
      return {};
    }
    const spellCategories = dbc.getTable<SpellCategories>(
      "SpellCategories",
      "SpellID",
    );
    const category = spellCategories.getFirst(input.id)?.ChargeCategory;
    if (!category || category === 0) {
      return {};
    }

    const spellCategory = dbc.getTable<SpellCategory>("SpellCategory", "ID");
    const categoryDefinition = spellCategory.getFirst(category);
    if (!categoryDefinition) {
      return {};
    }

    const charges = effectWithModifiers<MaxCharges>(
      spellList,
      input,
      {
        max: categoryDefinition.MaxCharges,
      },
      (acc, effect) => {
        if (effect.aura !== 411) {
          return acc;
        }

        return {
          max: (acc?.max ?? 0) + effect.basePoints,
        };
      },
    );

    const cooldown = effectWithModifiers<Cooldown>(
      spellList,
      input,
      { duration: categoryDefinition.ChargeRecoveryTime, hasted: false },
      (acc, effect) => {
        if (effect.aura === EffectType.CHARGE_RECOVERY_MULTIPLIER) {
          return {
            ...acc,
            duration:
              (acc?.duration ?? 0) +
              categoryDefinition.ChargeRecoveryTime * (effect.basePoints / 100),
          };
        }
        if (effect.aura === EffectType.CHARGE_RECOVERY_BY_HASTE) {
          return {
            ...acc,
            hasted: true,
          };
        }
        return acc;
      },
    );

    return {
      charges,
      cooldown,
    };
  },
});

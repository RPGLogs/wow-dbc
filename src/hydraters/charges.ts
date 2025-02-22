import { hydrater } from "./internal/types.ts";
import effects, {
  EffectType,
  effectWithModifiers,
  type WithModifiers,
} from "./effects.ts";
import passive from "./passive.ts";

interface Output {
  charges?: WithModifiers<MaxCharges>;
  cooldown?: WithModifiers<Cooldown>;
}

interface MaxCharges {
  max: number;
}
interface Cooldown {
  duration: number;
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

    // TODO: hasted cooldown with charges
    const cooldown = effectWithModifiers<Cooldown>(
      spellList,
      input,
      { duration: categoryDefinition.ChargeRecoveryTime },
      (acc, effect) => {
        if (effect.aura !== EffectType.CHARGE_RECOVERY_MULTIPLIER) {
          return acc;
        }
        return {
          duration:
            (acc?.duration ?? 0) +
            categoryDefinition.ChargeRecoveryTime * (effect.basePoints / 100),
        };
      },
    );

    return {
      charges,
      cooldown,
    };
  },
});

import { hydrater } from "./internal/types.ts";
import charges from "./charges.ts";
import type { WithModifiers } from "./effects.ts";
import effects, {
  EffectMiscValue,
  EffectType,
  effectWithModifiers,
  type EffectAccumulator,
} from "./effects.ts";
import passive from "./passive.ts";

export interface CooldownOutput {
  cooldown?: WithModifiers<Cooldown>;
}

export interface Cooldown {
  duration: number;
  hasted: boolean;
}

interface SpellCooldown {
  SpellID: number;
  // not entirely sure on the interactions between CategoryRecoveryTime and RecoveryTime, but based on Ice Block it looks like the former takes precedence?
  CategoryRecoveryTime: number;
  RecoveryTime: number;
  StartRecoveryTime: number;
}

/**
 * Retrieve the cooldown for a spell, along with modifiers. This depends on `charges` to avoid conflicts. Cooldowns from charge categories take priority over cooldowns from `SpellCooldowns`.
 */
export default hydrater({
  name: "cooldown",
  tables: [{ name: "SpellCooldowns", key: "SpellID" }],
  dependencies: { charges, effects, passive },
  hydrate(dbc, input, spellList): CooldownOutput {
    if (input.passive || input.cooldown) {
      return {};
    }

    const spellCooldown = dbc.getTable<SpellCooldown>(
      "SpellCooldowns",
      "SpellID",
    );
    const cooldown = spellCooldown.getFirst(input.id);
    if (!cooldown) {
      return {};
    }

    const baseCooldown =
      cooldown.CategoryRecoveryTime > 0
        ? cooldown.CategoryRecoveryTime
        : cooldown.RecoveryTime;

    const accumulator: EffectAccumulator<Cooldown> = (acc, effect) => {
      let duration = 0;
      if (
        effect.aura === EffectType.ADD_FLAT_MODIFIER &&
        effect.misc0 === EffectMiscValue.Cooldown
      ) {
        duration = effect.basePoints;
      }
      let hasted = false;
      if (effect.aura === EffectType.MOD_COOLDOWN_BY_HASTE) {
        hasted = true;
      }

      if (!hasted && !duration) {
        return acc;
      }

      return {
        duration: (acc?.duration ?? 0) + duration,
        hasted: Boolean(acc?.hasted) || hasted,
      };
    };
    const cd = effectWithModifiers(
      spellList,
      input,
      {
        duration: baseCooldown,
        hasted: false,
      },
      accumulator,
    );

    if (
      !cd ||
      (cd.duration === 0 && (!cd.modifiers || cd.modifiers.length === 0))
    ) {
      return {};
    }

    return {
      cooldown: cd,
    };
  },
});

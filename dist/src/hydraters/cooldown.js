import { hydrater } from "./internal/types.js";
import charges from "./charges.js";
import effects, { EffectMiscValue, EffectType, effectWithModifiers, } from "./effects.js";
import passive from "./passive.js";
/**
 * Retrieve the cooldown for a spell, along with modifiers. This depends on `charges` to avoid conflicts. Cooldowns from charge categories take priority over cooldowns from `SpellCooldowns`.
 */
export default hydrater({
    name: "cooldown",
    tables: [{ name: "SpellCooldowns", key: "SpellID" }],
    dependencies: { charges, effects, passive },
    hydrate(dbc, input, spellList) {
        if (input.passive || input.cooldown) {
            return {};
        }
        const spellCooldown = dbc.getTable("SpellCooldowns", "SpellID");
        const cooldown = spellCooldown.getFirst(input.id);
        if (!cooldown) {
            return {};
        }
        const baseCooldown = cooldown.CategoryRecoveryTime > 0
            ? cooldown.CategoryRecoveryTime
            : cooldown.RecoveryTime;
        const accumulator = (acc, effect) => {
            let duration = 0;
            if (effect.aura === EffectType.ADD_FLAT_MODIFIER &&
                effect.misc0 === EffectMiscValue.Cooldown) {
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
        const cd = effectWithModifiers(spellList, input, {
            duration: baseCooldown,
            hasted: false,
        }, accumulator);
        if (!cd ||
            (cd.duration === 0 && (!cd.modifiers || cd.modifiers.length === 0))) {
            return {};
        }
        return {
            cooldown: cd,
        };
    },
});

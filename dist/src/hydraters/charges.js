import { hydrater } from "./internal/types.js";
import effects, { EffectType, effectWithModifiers, } from "./effects.js";
import passive from "./passive.js";
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
    hydrate(dbc, input, spellList) {
        if (input.passive) {
            return {};
        }
        const spellCategories = dbc.getTable("SpellCategories", "SpellID");
        const category = spellCategories.getFirst(input.id)?.ChargeCategory;
        if (!category || category === 0) {
            return {};
        }
        const spellCategory = dbc.getTable("SpellCategory", "ID");
        const categoryDefinition = spellCategory.getFirst(category);
        if (!categoryDefinition) {
            return {};
        }
        const charges = effectWithModifiers(spellList, input, {
            max: categoryDefinition.MaxCharges,
        }, (acc, effect) => {
            if (effect.aura !== 411) {
                return acc;
            }
            return {
                max: (acc?.max ?? 0) + effect.basePoints,
            };
        });
        const cooldown = effectWithModifiers(spellList, input, { duration: categoryDefinition.ChargeRecoveryTime, hasted: false }, (acc, effect) => {
            if (effect.aura === EffectType.CHARGE_RECOVERY_MULTIPLIER) {
                return {
                    ...acc,
                    duration: (acc?.duration ?? 0) +
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
        });
        return {
            charges,
            cooldown,
        };
    },
});

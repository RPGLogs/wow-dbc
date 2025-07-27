import { hydrater, SpellType } from "./internal/types.js";
import classMask, { matchesClassMask } from "./classMask.js";
import label from "./label.js";
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
    hydrate(dbc, input, spellList) {
        const spellEffect = dbc.getTable("SpellEffect", "SpellID");
        const spellCategories = dbc.getTable("SpellCategories", "SpellID");
        const category = spellCategories.getFirst(input.id);
        const outputEffects = [];
        for (const spell of spellList.values()) {
            const effects = spellEffect.getAll(spell.id);
            if (!effects) {
                continue;
            }
            for (const effect of effects) {
                if (!matchesClassMask(input, [
                    effect.EffectSpellClassMask_0,
                    effect.EffectSpellClassMask_1,
                    effect.EffectSpellClassMask_2,
                    effect.EffectSpellClassMask_3,
                ]) &&
                    !matchesCategory(effect, category)) {
                    continue;
                }
                const modifiers = pointModifiers(spell, effect, spellEffect, spellList);
                const period = effect.EffectAuraPeriod > 0 ? effect.EffectAuraPeriod : undefined;
                const triggeredSpell = effect.EffectTriggerSpell > 0 ? effect.EffectTriggerSpell : undefined;
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
function matchesCategory(effect, category) {
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
function pointModifiers(spell, effect, spellEffect, spellList) {
    if (!spell.label) {
        return [];
    }
    const modifiers = {};
    for (const otherSpell of spellList.values()) {
        const effects = spellEffect.getAll(otherSpell.id);
        for (const maybeModifier of effects) {
            if (maybeModifier.EffectAura ===
                EffectType.ADD_FLAT_MODIFIER_BY_SPELL_LABEL &&
                // effectIndexLookup will be undefined if this isn't actually modifying the effect
                effectIndexLookup[maybeModifier.EffectMiscValue_0] ===
                    effect.EffectIndex &&
                spell.label?.includes(maybeModifier.EffectMiscValue_1)) {
                modifiers[otherSpell.id] = maybeModifier.EffectBasePointsF;
            }
        }
    }
    return modifiers;
}
// manually built from wago.tools data
const effectIndexLookup = {
    [EffectMiscValue.EffectIndex0]: 0,
    [EffectMiscValue.EffectIndex1]: 1,
    [EffectMiscValue.EffectIndex2]: 2,
    [EffectMiscValue.EffectIndex3]: 3,
    [EffectMiscValue.EffectIndex4]: 4,
};
const effectCategoryTypes = {
    [EffectType.MOD_MAX_CHARGES]: "ChargeCategory",
    [EffectType.CHARGE_RECOVERY_MULTIPLIER]: "ChargeCategory",
    [EffectType.CHARGE_RECOVERY_BY_HASTE]: "ChargeCategory",
};
function isBaselinePassiveSpell(spellList, spellId) {
    const spell = spellList.get(spellId);
    return (spell?.type === SpellType.Baseline &&
        "passive" in spell &&
        Boolean(spell?.passive));
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
export function effectWithModifiers(spellList, spell, baselineValue, accumulateEffectValue) {
    const effectsWithModifiers = spell.effects.flatMap((effect) => {
        const result = [{ requires: [effect.sourceSpellId], effect }];
        if (effect.pointModifiers) {
            for (const [extraSpell, pointModifier] of Object.entries(effect.pointModifiers)) {
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
        .filter(({ requires }) => requires.every((id) => isBaselinePassiveSpell(spellList, id)))
        .map(({ effect }) => effect);
    const base = baselineEffects.reduce((val, effect) => accumulateEffectValue(val, effect), baselineValue);
    const modifierEffectsBySource = effectsWithModifiers
        .filter(({ requires }) => requires.some((id) => !isBaselinePassiveSpell(spellList, id)))
        .reduce((map, { requires, effect }) => {
        const key = requires.join(",");
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(effect);
        return map;
    }, new Map());
    const modifiers = Array.from(modifierEffectsBySource.entries())
        .map(([key, effects]) => {
        const requires = key.split(",").map(Number);
        const result = effects.reduce((val, effect) => accumulateEffectValue(val, effect), undefined);
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

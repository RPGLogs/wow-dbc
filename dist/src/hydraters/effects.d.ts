import { type AnySpell } from "./internal/types.ts";
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
declare const _default: import("./internal/types.ts").Hydrater<EffectsOutput, {
    classMask: import("./internal/types.ts").Hydrater<import("./classMask.ts").ClassMaskOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
    label: import("./internal/types.ts").Hydrater<import("./label.ts").LabelOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
}>;
export default _default;
export declare const EffectType: {
    PERIODIC_TRIGGER_SPELL: number;
    APPLY_GLYPH: number;
    ADD_FLAT_MODIFIER: number;
    ADD_PCT_MODIFIER: number;
    ADD_FLAT_MODIFIER_BY_SPELL_LABEL: number;
    OVERRIDE_ACTIONBAR_SPELLS: number;
    OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED: number;
    MOD_MAX_CHARGES: number;
    MOD_COOLDOWN_BY_HASTE: number;
    MOD_GCD_BY_HASTE: number;
    CHARGE_RECOVERY_MULTIPLIER: number;
    CHARGE_RECOVERY_BY_HASTE: number;
};
export declare const EffectMiscValue: {
    EffectIndex0: number;
    Cooldown: number;
    EffectIndex1: number;
    StartCooldown: number;
    EffectIndex2: number;
    EffectIndex3: number;
    EffectIndex4: number;
};
export type Modifier<T> = Partial<T> & {
    /** The list of spells which must ALL be known to enable this modifier. */
    requiredSpells: number[];
};
export type WithModifiers<T> = T & {
    modifiers?: Modifier<T>[];
};
export interface EffectAccumulator<T> {
    (acc: T | Partial<T> | undefined, effect: SpellEffect): T | Partial<T> | undefined;
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
export declare function effectWithModifiers<T>(spellList: Map<number, AnySpell>, spell: AnySpell & EffectsOutput, baselineValue: T, accumulateEffectValue: EffectAccumulator<T>): WithModifiers<T> | undefined;
//# sourceMappingURL=effects.d.ts.map
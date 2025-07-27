import { type WithModifiers } from "./effects.ts";
export interface GcdOutput {
    gcd?: WithModifiers<Gcd>;
}
interface Gcd {
    duration: number;
    hasted: boolean;
}
/**
 * Retrieve the global cooldown information for a spell. The default global cooldown is applied via category 133. Virtually all spells have this category, or category 0 (indicating an off-gcd spell).
 *
 * Haste is not applied by default to most spells that use weapons. However, effects may cause those spells to have hasted GCDs. Conventionally, there is a "spec aura" that applies an effect to haste all GCDs for melee/phys ranged specs with hasted GCDs, such as Death Knights or Warriors.
 *
 * Haste *is* applied by default to spells that do not use weapons, unless they have the "Is Ability" flag in `SpellMisc`, which seems to mostly be used for unarmed "attacks" like Feral/Guardian Druid spells. Effects may override this exception.
 */
declare const _default: import("./internal/types.ts").Hydrater<GcdOutput, {
    effects: import("./internal/types.ts").Hydrater<import("./effects.ts").EffectsOutput, {
        classMask: import("./internal/types.ts").Hydrater<import("./classMask.ts").ClassMaskOutput, Record<string, import("./internal/types.ts").Hydrater<Record<string, any>, any>>>;
        label: import("./internal/types.ts").Hydrater<import("./label.ts").LabelOutput, Record<string, import("./internal/types.ts").Hydrater<Record<string, any>, any>>>;
    }>;
    passive: import("./internal/types.ts").Hydrater<import("./passive.ts").PassiveOutput, Record<string, import("./internal/types.ts").Hydrater<Record<string, any>, any>>>;
}>;
export default _default;
//# sourceMappingURL=gcd.d.ts.map
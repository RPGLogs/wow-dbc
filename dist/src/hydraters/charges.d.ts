import { type WithModifiers } from "./effects.ts";
import type { Cooldown } from "./cooldown.ts";
export interface ChargesOutput {
    charges?: WithModifiers<MaxCharges>;
    cooldown?: WithModifiers<Cooldown>;
}
export interface MaxCharges {
    max: number;
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
declare const _default: import("./internal/types.ts").Hydrater<ChargesOutput, {
    passive: import("./internal/types.ts").Hydrater<import("./passive.ts").PassiveOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
    effects: import("./internal/types.ts").Hydrater<import("./effects.ts").EffectsOutput, {
        classMask: import("./internal/types.ts").Hydrater<import("./classMask.ts").ClassMaskOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
        label: import("./internal/types.ts").Hydrater<import("./label.ts").LabelOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
    }>;
}>;
export default _default;
//# sourceMappingURL=charges.d.ts.map
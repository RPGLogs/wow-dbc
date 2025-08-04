import type { WithModifiers } from "./effects.ts";
export interface CooldownOutput {
    cooldown?: WithModifiers<Cooldown>;
}
export interface Cooldown {
    duration: number;
    hasted: boolean;
}
/**
 * Retrieve the cooldown for a spell, along with modifiers. This depends on `charges` to avoid conflicts. Cooldowns from charge categories take priority over cooldowns from `SpellCooldowns`.
 */
declare const _default: import("./internal/types.ts").Hydrater<CooldownOutput, {
    charges: import("./internal/types.ts").Hydrater<import("./charges.ts").ChargesOutput, {
        passive: import("./internal/types.ts").Hydrater<import("./passive.ts").PassiveOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
        effects: import("./internal/types.ts").Hydrater<import("./effects.ts").EffectsOutput, {
            classMask: import("./internal/types.ts").Hydrater<import("./classMask.ts").ClassMaskOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
            label: import("./internal/types.ts").Hydrater<import("./label.ts").LabelOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
        }>;
    }>;
    effects: import("./internal/types.ts").Hydrater<import("./effects.ts").EffectsOutput, {
        classMask: import("./internal/types.ts").Hydrater<import("./classMask.ts").ClassMaskOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
        label: import("./internal/types.ts").Hydrater<import("./label.ts").LabelOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
    }>;
    passive: import("./internal/types.ts").Hydrater<import("./passive.ts").PassiveOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
}>;
export default _default;
//# sourceMappingURL=cooldown.d.ts.map
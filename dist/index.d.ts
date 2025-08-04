import type { Dbc } from "./src/dbc.ts";
import { type FinalOutput } from "./src/hydraters/index.ts";
import type { AnyHydrater, AnySpell } from "./src/hydraters/internal/types.ts";
export { dbc } from "./src/dbc.ts";
declare const retailSpellPreset: {
    castTime: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/castTime.ts").CastTimeOutput, Record<string, AnyHydrater>>;
    channel: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/channel.ts").ChannelOutput, Record<string, AnyHydrater>>;
    charges: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
        passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
        effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
            label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
        }>;
    }>;
    cooldown: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/cooldown.ts").CooldownOutput, {
        charges: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
            passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
            effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
                label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
            }>;
        }>;
        effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
            label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
        }>;
        passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
    }>;
    gcd: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/gcd.ts").GcdOutput, {
        effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
            label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
        }>;
        passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
    }>;
    name: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/name.ts").NameOutput, Record<string, AnyHydrater>>;
    passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
    castableWhileCasting: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/castableWhileCasting.ts").CWCOutput, Record<string, AnyHydrater>>;
    icon: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/icon.ts").IconOutput, Record<string, AnyHydrater>>;
};
export type RetailSpell = FinalOutput<typeof retailSpellPreset>;
export type HydraterDefinition = Record<string, AnyHydrater>;
export declare const PRESETS: {
    RETAIL: {
        castTime: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/castTime.ts").CastTimeOutput, Record<string, AnyHydrater>>;
        channel: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/channel.ts").ChannelOutput, Record<string, AnyHydrater>>;
        charges: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
            passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
            effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
                label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
            }>;
        }>;
        cooldown: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/cooldown.ts").CooldownOutput, {
            charges: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
                passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
                effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                    classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
                    label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
                }>;
            }>;
            effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
                label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
            }>;
            passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
        }>;
        gcd: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/gcd.ts").GcdOutput, {
            effects: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, AnyHydrater>>;
                label: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, AnyHydrater>>;
            }>;
            passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
        }>;
        name: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/name.ts").NameOutput, Record<string, AnyHydrater>>;
        passive: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, AnyHydrater>>;
        castableWhileCasting: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/castableWhileCasting.ts").CWCOutput, Record<string, AnyHydrater>>;
        icon: import("./src/hydraters/index.ts").Hydrater<import("./src/hydraters/icon.ts").IconOutput, Record<string, AnyHydrater>>;
    };
};
export declare function loadAll<H extends HydraterDefinition>(hydraterDef: H, dbc: Dbc, spellList: AnySpell[]): Promise<FinalOutput<H>[]>;
export declare function retailSpecList(dbc: Dbc): Promise<number[]>;
export declare function retailSpellList(dbc: Dbc, specId: number): Promise<AnySpell[]>;
export declare function classicSpellList(dbc: Dbc, specId: number): Promise<AnySpell[]>;
export declare function getSpecIdByName(dbc: Dbc, className: string, specName: string): Promise<number | undefined>;
//# sourceMappingURL=index.d.ts.map
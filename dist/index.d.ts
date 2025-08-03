import type { Dbc } from "./src/dbc.ts";
import { type FinalOutput, type Hydrater } from "./src/hydraters/index.ts";
import type { AnySpell } from "./src/hydraters/internal/types.ts";
export { dbc } from "./src/dbc.ts";
declare const retailSpellPreset: {
    castTime: Hydrater<import("./src/hydraters/castTime.ts").CastTimeOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    channel: Hydrater<import("./src/hydraters/channel.ts").ChannelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    charges: Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
        passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        }>;
    }>;
    cooldown: Hydrater<import("./src/hydraters/cooldown.ts").CooldownOutput, {
        charges: Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
            passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            }>;
        }>;
        effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        }>;
        passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    }>;
    gcd: Hydrater<import("./src/hydraters/gcd.ts").GcdOutput, {
        effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
            classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        }>;
        passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    }>;
    name: Hydrater<import("./src/hydraters/name.ts").NameOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    castableWhileCasting: Hydrater<import("./src/hydraters/castableWhileCasting.ts").CWCOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    icon: Hydrater<import("./src/hydraters/icon.ts").IconOutput, Record<string, Hydrater<Record<string, any>, any>>>;
};
export type RetailSpell = FinalOutput<typeof retailSpellPreset>;
export type HydraterDefinition = Record<string, Hydrater<any, any>>;
export declare const PRESETS: {
    RETAIL: {
        castTime: Hydrater<import("./src/hydraters/castTime.ts").CastTimeOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        channel: Hydrater<import("./src/hydraters/channel.ts").ChannelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        charges: Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
            passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            }>;
        }>;
        cooldown: Hydrater<import("./src/hydraters/cooldown.ts").CooldownOutput, {
            charges: Hydrater<import("./src/hydraters/charges.ts").ChargesOutput, {
                passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                    classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                    label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                }>;
            }>;
            effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            }>;
            passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        }>;
        gcd: Hydrater<import("./src/hydraters/gcd.ts").GcdOutput, {
            effects: Hydrater<import("./src/hydraters/effects.ts").EffectsOutput, {
                classMask: Hydrater<import("./src/hydraters/classMask.ts").ClassMaskOutput, Record<string, Hydrater<Record<string, any>, any>>>;
                label: Hydrater<import("./src/hydraters/label.ts").LabelOutput, Record<string, Hydrater<Record<string, any>, any>>>;
            }>;
            passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        }>;
        name: Hydrater<import("./src/hydraters/name.ts").NameOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        passive: Hydrater<import("./src/hydraters/passive.ts").PassiveOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        castableWhileCasting: Hydrater<import("./src/hydraters/castableWhileCasting.ts").CWCOutput, Record<string, Hydrater<Record<string, any>, any>>>;
        icon: Hydrater<import("./src/hydraters/icon.ts").IconOutput, Record<string, Hydrater<Record<string, any>, any>>>;
    };
};
export declare function loadAll<H extends HydraterDefinition>(hydraterDef: H, dbc: Dbc, spellList: AnySpell[]): Promise<FinalOutput<H>[]>;
export declare function retailSpecList(dbc: Dbc): Promise<number[]>;
export declare function retailSpellList(dbc: Dbc, specId: number): Promise<AnySpell[]>;
export declare function classicSpellList(dbc: Dbc, specId: number): Promise<AnySpell[]>;
export declare function getSpecIdByName(dbc: Dbc, className: string, specName: string): Promise<number | undefined>;
//# sourceMappingURL=index.d.ts.map
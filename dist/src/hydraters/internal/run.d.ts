import type { Dbc } from "../../dbc.ts";
import type { AnySpell, Input, AnyHydrater } from "./types.ts";
export type FinalOutput<T extends Record<string, AnyHydrater>> = Input<T>;
/**
 * Apply a collection of `Hydrater`s to a list of spells, producing a list of spell objects.
 * The output is not guaranteed to be the same order as the input.
 */
export declare function doHydration<H extends Record<string, AnyHydrater>>(hydraters: H, dbc: Dbc, spellList: AnySpell[]): Promise<FinalOutput<H>[]>;
//# sourceMappingURL=run.d.ts.map
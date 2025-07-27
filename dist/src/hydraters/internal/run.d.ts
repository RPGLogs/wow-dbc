import type { Dbc } from "../../dbc.ts";
import type { AnySpell, Hydrater, Input } from "./types.ts";
export type FinalOutput<T extends Record<string, Hydrater<any, any>>> = Input<T>;
/**
 * Apply a collection of `Hydrater`s to a list of spells, producing a list of spell objects.
 * The output is not guaranteed to be the same order as the input.
 */
export declare function doHydration<H extends Record<string, Hydrater<any, any>>>(hydraters: H, dbc: Dbc, spellList: AnySpell[]): Promise<FinalOutput<H>[]>;
//# sourceMappingURL=run.d.ts.map
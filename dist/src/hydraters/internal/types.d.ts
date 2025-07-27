import type { Dbc } from "../../dbc.ts";
export declare const SpellType: {
    Baseline: "baseline";
    Talent: "talent";
    Learned: "learned";
    Temporary: "temporary";
};
export type SpellType = (typeof SpellType)[keyof typeof SpellType];
interface SharedSpellProps {
    id: number;
    /**
     * Indicates that this spell, when known, overrides another spell with this id.
     */
    overrides?: number;
}
/**
 * A spell that is always available to the player at max level as a result of their
 * selected class/spec.
 */
export interface BaselineSpell extends SharedSpellProps {
    type: "baseline";
}
/**
 * A spell that is taught by another spell. The availability of the learned spell is the
 * availability of the spell it is `taughtBy`.
 */
export interface LearnedSpell extends SharedSpellProps {
    type: "learned";
    taughtBy: number;
}
/**
 * A spell that comes from a Dragonflight talent tree.
 */
export interface TalentSpell extends SharedSpellProps {
    type: "talent";
    requiresTalentEntry: number[];
    visibleSpellId?: number;
    /**
     * Granted talents are generally not included in talent exports, including combat log data.
     */
    granted?: boolean;
}
/**
 * A spell that is temporarily available, such as a temporary override due to a buff.
 */
export interface TemporarySpell extends SharedSpellProps {
    type: "temporary";
    grantedBy: number;
}
export type AnySpell = BaselineSpell | LearnedSpell | TalentSpell | TemporarySpell;
/**
 * Build a hydrater. This method triggers type inferrence in a way that *mostly* doesn't require
 * manual type annotations.
 */
export declare function hydrater<Output extends Record<string, any>, Deps extends Record<string, Hydrater<Record<string, any>, any>>>(h: Record<string, any> & Hydrater<Output, Deps>): Hydrater<Output, Deps>;
/**
 * A *hydrater* defines how to produce (hydrate) a set of `Output` fields from spell data.
 * Hydraters may have dependencies on other Hydraters, which will be run first to populate
 * *their* `Output`s. This allows the hydration of complex output types to be split out into
 * (mostly) independent objects.
 */
export interface Hydrater<Output extends Record<string, any>, Deps extends Record<string, Hydrater<Record<string, any>, any>>> {
    name: string;
    /**
     * Dependencies for the hydrater. Dependencies will be run first. Circular dependencies will
     * cause a hydration error in `doHydration`.
     *
     * *Note:* dependencies are supplied as an *object* rather than a *list* in order to work
     * around some limitations of TypeScript's inference. Using a list would result in an opaque type
     * when composing hydraters.
     */
    dependencies?: Deps;
    /**
     * A list of tables to pre-load and index before calling `hydrate`. This is a performance optimization,
     * and allows `hydrate` to be non-async (which matters an annoying amount when processing thousands of entries).
     */
    tables: TableRef[];
    /**
     * Perform the hydration of `Output`. Note that you *do not* need to merge this with `input`, just output the *new fields*.
     */
    hydrate(dbc: Dbc, input: Input<Deps>, spellList: Map<number, Input<Deps>>): Output;
}
interface TableRef {
    name: string;
    key: string;
}
type Output<T> = T extends Hydrater<infer Out, any> ? Out : never;
type InputRaw<T extends Record<string, Hydrater<any, any>>> = {
    [k in keyof T]: (x: Output<T[k]>) => void;
}[keyof T] extends (x: infer I) => void ? I : never;
/**
 * Inner type that "flattens" a composed type. This is helpful for type tooltips,
 * especially if you narrow the result to a single spell type.
 */
type InputFlat<Base, T extends Record<string, Hydrater<any, any>>> = Base & {
    [k in keyof InputRaw<T>]: InputRaw<T>[k];
};
/**
 * The input of a `Hydrater`, defined by its `Deps` (aka `T`).
 */
export type Input<T extends Record<string, Hydrater<any, any>>> = InputFlat<BaselineSpell, T> | InputFlat<TalentSpell, T> | InputFlat<LearnedSpell, T> | InputFlat<TemporarySpell, T>;
export {};
//# sourceMappingURL=types.d.ts.map
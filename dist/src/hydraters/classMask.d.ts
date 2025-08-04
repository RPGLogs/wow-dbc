export interface ClassMaskOutput {
    classMask?: [number, number, number, number];
}
/**
 * Load the "class mask" for a spell from `SpellClassOptions`. The class mask is a list of 4 bitfields that is used to filter effects to sets of class spells.
 *
 * The `matchesClassMask` method implements checking if a spell matches a class mask retrieved from another source.
 */
declare const _default: import("./internal/types.ts").Hydrater<ClassMaskOutput, Record<string, import("./internal/types.ts").AnyHydrater>>;
export default _default;
/**
 * Check if the provided filter matches the class mask for `spell`.
 *
 * The filter matches if for any field, `mask[i] & filter[i] != 0`.
 */
export declare function matchesClassMask(spell: ClassMaskOutput, filter: Required<ClassMaskOutput>["classMask"]): boolean;
//# sourceMappingURL=classMask.d.ts.map
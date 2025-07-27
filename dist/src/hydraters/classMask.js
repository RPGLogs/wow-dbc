import { hydrater } from "./internal/types.js";
/**
 * Load the "class mask" for a spell from `SpellClassOptions`. The class mask is a list of 4 bitfields that is used to filter effects to sets of class spells.
 *
 * The `matchesClassMask` method implements checking if a spell matches a class mask retrieved from another source.
 */
export default hydrater({
    name: "classMask",
    tables: [{ name: "SpellClassOptions", key: "SpellID" }],
    hydrate(dbc, input) {
        const spellClassOptions = dbc.getTable("SpellClassOptions", "SpellID");
        const options = spellClassOptions.getFirst(input.id);
        if (options) {
            return {
                classMask: [
                    options.SpellClassMask_0,
                    options.SpellClassMask_1,
                    options.SpellClassMask_2,
                    options.SpellClassMask_3,
                ],
            };
        }
        return {};
    },
});
/**
 * Check if the provided filter matches the class mask for `spell`.
 *
 * The filter matches if for any field, `mask[i] & filter[i] != 0`.
 */
export function matchesClassMask(spell, filter) {
    if (!spell.classMask) {
        return false;
    }
    for (let i = 0; i < 4; i += 1) {
        if (spell.classMask[i] & filter[i]) {
            return true;
        }
    }
    return false;
}

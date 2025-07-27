import { SpellType } from "../hydraters/internal/types.js";
/**
 * Get specialization-specific spells that are learned automatically. This does not include base class spells, and does not include opt-in spells from talents (even if technically you have to take them in order to spend any talent points).
 * @param dbc
 * @param specId
 */
export default async function specSpells(dbc, specId) {
    const specializationSpells = await dbc.loadTable("SpecializationSpells", "SpecID");
    return specializationSpells
        .getAll(specId)
        .map(({ SpellID, OverridesSpellID }) => ({
        id: SpellID,
        type: SpellType.Baseline,
        overrides: OverridesSpellID > 0 ? OverridesSpellID : undefined,
    }));
}

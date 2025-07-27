import {} from "../dbc.js";
export default async function mistsTalentSpells(dbc, classId, specId) {
    const talents = await dbc.loadTable("Talent", "ClassID");
    const entries = talents.getAll(classId);
    return entries
        .filter((entry) => entry.SpecID === 0 || entry.SpecID === specId)
        .map((entry) => ({
        id: entry.SpellID,
        overrides: entry.OverridesSpellID > 0 ? entry.OverridesSpellID : undefined,
        type: "mists-talent",
        row: entry.TierID,
        column: entry.ColumnIndex + 1,
    }));
}

import { SpellType } from "../hydraters/internal/types.js";
export function isRemovedSpell(dbc, spellId) {
    const table = dbc.getTable("Spell", "ID");
    return table.getFirst(spellId) === undefined;
}
// magic flag for class skill line
const CLASS_SKILL_FLAGS = 0x418;
export async function classSkillLine(dbc, classId) {
    const skillRaceClassInfo = await dbc.loadTable("SkillRaceClassInfo", "Flags");
    return skillRaceClassInfo
        .getAll(CLASS_SKILL_FLAGS)
        .find(({ ClassMask }) => ClassMask === 2 ** (classId - 1))?.SkillID;
}
export default async function classSpells(dbc, classId) {
    const skillLineId = await classSkillLine(dbc, classId);
    if (!skillLineId) {
        return [];
    }
    const skillLineAbilities = await dbc.loadTable("SkillLineAbility", "SkillLine");
    await dbc.loadTable("Spell", "ID");
    return skillLineAbilities
        .getAll(skillLineId)
        .filter(({ Spell }) => !isRemovedSpell(dbc, Spell))
        .map(({ Spell }) => ({ id: Spell, type: SpellType.Baseline }));
}

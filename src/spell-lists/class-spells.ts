import type { Dbc } from "../dbc.ts";
import type { BaseSpell } from "../types.ts";
import { SpellSource } from "../types.ts";

interface SkillRaceClassInfo {
  ClassMask: number;
  SkillID: number;
  Flags: number;
}

interface SkillLineAbility {
  SkillLine: number;
  Spell: number;
}

// magic flag for class skill line
const CLASS_SKILL_FLAGS = 0x418;

export async function classSkillLine(
  dbc: Dbc,
  classId: number,
): Promise<number | undefined> {
  const skillRaceClassInfo =
    await dbc.getTable<SkillRaceClassInfo>("SkillRaceClassInfo");
  return skillRaceClassInfo.find(
    ({ Flags, ClassMask }) =>
      Flags === CLASS_SKILL_FLAGS && ClassMask === 2 ** (classId - 1),
  )?.SkillID;
}

export default async function classSpells(
  dbc: Dbc,
  classId: number,
): Promise<BaseSpell[]> {
  const skillLineId = await classSkillLine(dbc, classId);
  if (!skillLineId) {
    return [];
  }

  const skillLineAbilities =
    await dbc.getTable<SkillLineAbility>("SkillLineAbility");
  return skillLineAbilities
    .filter(({ SkillLine }) => SkillLine === skillLineId)
    .map(({ Spell }) => ({ id: Spell, source: SpellSource.Class }));
}

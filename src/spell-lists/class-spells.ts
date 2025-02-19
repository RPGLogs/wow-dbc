import type { Dbc } from "../dbc.ts";
import type { BaseSpell } from "../types.ts";
import { SpellType } from "../types.ts";

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
  const skillRaceClassInfo = await dbc.loadTable<SkillRaceClassInfo>(
    "SkillRaceClassInfo",
    "Flags",
  );
  return skillRaceClassInfo
    .getAll(CLASS_SKILL_FLAGS)
    .find(({ ClassMask }) => ClassMask === 2 ** (classId - 1))?.SkillID;
}

export default async function classSpells(
  dbc: Dbc,
  classId: number,
): Promise<BaseSpell[]> {
  const skillLineId = await classSkillLine(dbc, classId);
  if (!skillLineId) {
    return [];
  }

  const skillLineAbilities = await dbc.loadTable<SkillLineAbility>(
    "SkillLineAbility",
    "SkillLine",
  );
  return skillLineAbilities
    .getAll(skillLineId)
    .map(({ Spell }) => ({ id: Spell, type: SpellType.Class }));
}

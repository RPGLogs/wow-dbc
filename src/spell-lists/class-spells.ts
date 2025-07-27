import type { Dbc } from "../dbc.ts";
import type { AnySpell } from "../hydraters/internal/types.ts";
import { SpellType } from "../hydraters/internal/types.ts";

interface SkillRaceClassInfo {
  ClassMask: number;
  SkillID: number;
  Flags: number;
}

interface SkillLineAbility {
  SkillLine: number;
  Spell: number;
}

export function isRemovedSpell(dbc: Dbc, spellId: number): boolean {
  const table = dbc.getTable("Spell", "ID");
  return table.getFirst(spellId) === undefined;
}

// magic flag for class skill line
const CLASS_SKILL_FLAGS = 0x410;
// TODO: not sure if we need this. it is currently not used. need to hook things up to retail again and see if classmask+base flags is enough
const RETAIL_CLASS_EXTRA_FLAGS = 0x8;

export async function classSkillLine(
  dbc: Dbc,
  classId: number,
): Promise<number | undefined> {
  const skillRaceClassInfo = await dbc.loadTable<SkillRaceClassInfo>(
    "SkillRaceClassInfo",
    "Flags",
  );
  return skillRaceClassInfo
    .contents()
    .filter(({ Flags }) => (Flags & CLASS_SKILL_FLAGS) > 0)
    .find(({ ClassMask }) => ClassMask === 2 ** (classId - 1))?.SkillID;
}

export default async function classSpells(
  dbc: Dbc,
  classId: number,
): Promise<AnySpell[]> {
  const skillLineId = await classSkillLine(dbc, classId);
  if (!skillLineId) {
    return [];
  }

  const skillLineAbilities = await dbc.loadTable<SkillLineAbility>(
    "SkillLineAbility",
    "SkillLine",
  );
  await dbc.loadTable("Spell", "ID");
  return skillLineAbilities
    .getAll(skillLineId)
    .filter(({ Spell }) => !isRemovedSpell(dbc, Spell))
    .map(({ Spell }) => ({ id: Spell, type: SpellType.Baseline }));
}

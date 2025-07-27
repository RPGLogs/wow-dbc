import { type Dbc } from "../dbc.ts";
import type { MistsTalentSpell } from "../hydraters/internal/types.ts";

interface Talent {
  ID: number;
  SpellID: number;
  TierID: number;
  ColumnIndex: number;
  ClassID: number;
  SpecID: number;
  OverridesSpellID: number;
}

export default async function mistsTalentSpells(
  dbc: Dbc,
  classId: number,
  specId: number,
): Promise<MistsTalentSpell[]> {
  const talents = await dbc.loadTable<Talent, "ClassID">("Talent", "ClassID");

  const entries = talents.getAll(classId);

  return entries
    .filter((entry) => entry.SpecID === 0 || entry.SpecID === specId)
    .map((entry) => ({
      id: entry.SpellID,
      overrides:
        entry.OverridesSpellID > 0 ? entry.OverridesSpellID : undefined,
      type: "mists-talent",
      row: entry.TierID,
      column: entry.ColumnIndex + 1,
    }));
}

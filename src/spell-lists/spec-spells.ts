import type { Dbc } from "../dbc.ts";
import { SpellSource, type BaseSpell } from "../types.ts";

interface SpecializationSpell {
  SpecID: number;
  SpellID: number;
  OverridesSpellID: number;
}

/**
 * Get specialization-specific spells that are learned automatically. This does not include base class spells, and does not include opt-in spells from talents (even if technically you have to take them in order to spend any talent points).
 * @param dbc
 * @param specId
 */
export default async function specSpells(
  dbc: Dbc,
  specId: number,
): Promise<BaseSpell[]> {
  const specializationSpells = await dbc.getTable<SpecializationSpell>(
    "SpecializationSpells",
  );
  return specializationSpells
    .filter(({ SpecID }) => SpecID === specId)
    .map(({ SpellID, OverridesSpellID }) => ({
      id: SpellID,
      source: SpellSource.Spec,
      overrides: OverridesSpellID > 0 ? OverridesSpellID : undefined,
    }));
}

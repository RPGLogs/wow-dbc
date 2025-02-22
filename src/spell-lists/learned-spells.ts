import type { Dbc } from "../dbc.ts";
import type { BaseSpell } from "../hydraters/internal/types.ts";

interface LearnedSpell extends BaseSpell {
  taughtBy: number;
}

interface SpellLearnSpell {
  SpellID: number;
  LearnSpellID: number;
  OverridesSpellID: number;
}

export default async function learnedSpells(
  dbc: Dbc,
  otherSpells: BaseSpell[],
): Promise<LearnedSpell[]> {
  const spellLearnSpell = await dbc.loadTable<SpellLearnSpell>(
    "SpellLearnSpell",
    "SpellID",
  );

  // technically, the same spell could be taught by multiple other spells, but we aren't handling that right now
  return otherSpells.flatMap((spell) => {
    const taughtSpells = spellLearnSpell.getAll(spell.id);
    return taughtSpells.map(({ LearnSpellID, OverridesSpellID }) => ({
      id: LearnSpellID,
      type: spell.type,
      overrides: OverridesSpellID > 0 ? OverridesSpellID : undefined,
      taughtBy: spell.id,
    }));
  });
}

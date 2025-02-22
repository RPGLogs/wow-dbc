import type { Dbc } from "../dbc.ts";
import {
  SpellType,
  type AnySpell,
  type LearnedSpell,
} from "../hydraters/internal/types.ts";

interface SpellLearnSpell {
  SpellID: number;
  LearnSpellID: number;
  OverridesSpellID: number;
}

export default async function learnedSpells(
  dbc: Dbc,
  otherSpells: AnySpell[],
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
      type: SpellType.Learned,
      overrides: OverridesSpellID > 0 ? OverridesSpellID : undefined,
      taughtBy: spell.id,
    }));
  });
}

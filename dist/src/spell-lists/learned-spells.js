import { SpellType, } from "../hydraters/internal/types.js";
export default async function learnedSpells(dbc, otherSpells) {
    const spellLearnSpell = await dbc.loadTable("SpellLearnSpell", "SpellID");
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

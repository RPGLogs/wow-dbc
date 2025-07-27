import { EffectType } from "../hydraters/effects.js";
import { SpellType, } from "../hydraters/internal/types.js";
export default async function temporarySpells(dbc, otherSpells) {
    const spellEffect = await dbc.loadTable("SpellEffect", "SpellID");
    return otherSpells.flatMap((spell) => {
        const effects = spellEffect.getAll(spell.id);
        return effects
            .filter((effect) => effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
            effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED)
            .map((effect) => ({
            id: effect.EffectBasePointsF === 0
                ? effect.EffectBasePoints
                : effect.EffectBasePointsF,
            grantedBy: spell.id,
            type: SpellType.Temporary,
        }));
    });
}

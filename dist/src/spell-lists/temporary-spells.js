import { EffectType } from "../hydraters/effects.js";
import { SpellType, } from "../hydraters/internal/types.js";
export default async function temporarySpells(dbc, otherSpells) {
    const spellEffect = await dbc.loadTable("SpellEffect", "SpellID");
    return otherSpells.flatMap((spell) => {
        const effects = spellEffect.getAll(spell.id);
        return (effects
            .filter((effect) => effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
            effect.EffectAura ===
                EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED)
            // some override effects have been left in the dbc that don't *do* anything
            .filter((effect) => effect.EffectBasePoints > 0 || effect.EffectBasePointsF > 0)
            .map((effect) => ({
            id: effect.EffectBasePointsF === 0
                ? effect.EffectBasePoints
                : effect.EffectBasePointsF,
            grantedBy: spell.id,
            type: SpellType.Temporary,
        })));
    });
}

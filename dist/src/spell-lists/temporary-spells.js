import { EffectType } from "../hydraters/effects.js";
import { SpellType, } from "../hydraters/internal/types.js";
/**
 * Extract temporary spells from spell effects. This will recurse at most once to find additional spells granted by those spells.
 */
function extractTemporarySpells(spellEffect, spell, recurse = true) {
    const effects = spellEffect.getAll(spell.id);
    const overrideSpells = effects
        .filter((effect) => effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
        effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED)
        // some override effects have been left in the dbc that don't *do* anything
        .filter((effect) => effect.EffectBasePoints > 0 || effect.EffectBasePointsF > 0)
        .map((effect) => ({
        id: effect.EffectBasePointsF === 0
            ? effect.EffectBasePoints
            : effect.EffectBasePointsF,
        grantedBy: spell.id,
        type: SpellType.Temporary,
    }));
    // should this include periodic triggered spells?
    const triggeredSpells = effects
        .filter((effect) => effect.Effect === EffectType.TRIGGER_SPELL && effect.EffectTriggerSpell)
        .map((effect) => ({
        id: effect.EffectTriggerSpell,
        grantedBy: spell.id,
        type: SpellType.Temporary,
    }));
    const result = overrideSpells.concat(triggeredSpells);
    if (recurse) {
        return result.concat(result.flatMap((spell) => extractTemporarySpells(spellEffect, spell, false)));
    }
    else {
        return result;
    }
}
export default async function temporarySpells(dbc, otherSpells) {
    const spellEffect = await dbc.loadTable("SpellEffect", "SpellID");
    return otherSpells.flatMap((spell) => extractTemporarySpells(spellEffect, spell));
}

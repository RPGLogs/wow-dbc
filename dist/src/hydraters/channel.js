import { hydrater } from "./internal/types.js";
import { EffectType } from "./effects.js";
/**
 * Retrieve data about the channeling that a spell causes. Broadly, there are 3 types of channeled spells:
 *
 * - Periodic Triggers: Channeling the spell causes another spell to periodically fire (via a `SpellEffect` entry).
 * - Auras: Channeling the spell applies a visible aura to the player for the duration of the channel.
 * - Special: the hopeless ones. Spells like Penance that *look like* simple periodic triggers from in-game usage are secretly special because their spell effects are just "Server-Side Effect".
 */
export default hydrater({
    name: "channel",
    tables: [
        { name: "SpellMisc", key: "SpellID" },
        { name: "SpellDuration", key: "ID" },
        { name: "SpellEffect", key: "SpellID" },
    ],
    hydrate(dbc, input) {
        const spellMisc = dbc.getTable("SpellMisc", "SpellID");
        const misc = spellMisc.getFirst(input.id);
        if (!misc) {
            return {};
        }
        const isChannel = Boolean(misc.Attributes_1 & CHANNELED_SPELL_MASK) ||
            Boolean(misc.Attributes_1 & CHANNELED_SELF_SPELL_MASK);
        if (!isChannel) {
            return {};
        }
        const spellDuration = dbc.getTable("SpellDuration", "ID");
        const duration = spellDuration.getFirst(misc.DurationIndex);
        if (!duration) {
            console.warn(`no duration found for channeled spell ${input.id}`);
        }
        // there are two separate flags. one for the periodic trigger being hasted, and one for the duration being hasted.
        const hasted = Boolean(misc.Attributes_8 & DURATION_HASTED_MASK);
        const periodicHasted = Boolean(misc.Attributes_5 & PERIODIC_TRIGGER_HASTED_MASK);
        const spellEffect = dbc.getTable("SpellEffect", "SpellID");
        const triggeredSpells = spellEffect
            .getAll(input.id)
            .filter((effect) => effect.EffectAura === EffectType.PERIODIC_TRIGGER_SPELL &&
            effect.EffectTriggerSpell)
            .map((effect) => ({
            spell: effect.EffectTriggerSpell,
            period: effect.EffectAuraPeriod,
            hasted: periodicHasted,
        }));
        const buffIsLogged = !Boolean(misc.Attributes_6 & BUFF_IS_LOGGED_MASK);
        // TODO: there are probably effects that adjust the duration or modify the trigger period
        return {
            channel: {
                duration: duration?.Duration ?? -1,
                hasted,
                buffIsLogged,
                triggeredSpells,
            },
        };
    },
});
const CHANNELED_SPELL_MASK = 0x4;
const CHANNELED_SELF_SPELL_MASK = 0x40;
const DURATION_HASTED_MASK = 0x20000;
const PERIODIC_TRIGGER_HASTED_MASK = 0x2000;
const BUFF_IS_LOGGED_MASK = 0x400;

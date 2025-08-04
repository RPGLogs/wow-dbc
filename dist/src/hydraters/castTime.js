import { hydrater } from "./internal/types.js";
export default hydrater({
    name: "castTime",
    tables: [
        { name: "SpellMisc", key: "SpellID" },
        { name: "SpellCastTimes", key: "ID" },
    ],
    hydrate(dbc, input) {
        const spellMisc = dbc.getTable("SpellMisc", "SpellID");
        const misc = spellMisc.getFirst(input.id);
        if (!misc || misc.CastingTimeIndex === 0) {
            return {};
        }
        const spellCastTimes = dbc.getTable("SpellCastTimes", "ID");
        const castTime = spellCastTimes.getFirst(misc.CastingTimeIndex);
        if (!castTime || castTime.Base === 0) {
            return {};
        }
        // TODO: cast time modification effects
        return {
            castTime: {
                duration: castTime.Base,
            },
        };
    },
});

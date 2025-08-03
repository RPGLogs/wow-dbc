import { hydrater } from "./internal/types.js";
export default hydrater({
    name: "icon",
    tables: [{ name: "SpellMisc", key: "SpellID" }],
    hydrate(dbc, input) {
        const spellMisc = dbc.getTable("SpellMisc", "SpellID");
        const entry = spellMisc.getFirst(input.id);
        if (!entry) {
            return {};
        }
        return {
            iconID: entry.SpellIconFileDataID,
        };
    },
});

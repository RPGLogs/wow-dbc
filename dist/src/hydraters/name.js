import { hydrater } from "./internal/types.js";
export default hydrater({
    name: "name",
    tables: [{ name: "SpellName", key: "ID" }],
    hydrate(dbc, input) {
        const names = dbc.getTable("SpellName", "ID");
        const name = names.getFirst(input.id)?.Name_lang;
        return {
            name: name ?? "Unknown",
        };
    },
});

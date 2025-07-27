import { hydrater } from "./internal/types.js";
const flag = 0x80;
export default hydrater({
    name: "castableWhileCasting",
    tables: [{ name: "SpellMisc", key: "SpellID" }],
    hydrate(dbc, input) {
        const misc = dbc.getTable("SpellMisc", "SpellID");
        const row = misc.getFirst(input.id);
        if (row && row.Attributes_4 & flag) {
            return { castableWhileCasting: true };
        }
        return {};
    },
});

import { hydrater } from "./internal/types.ts";

interface Output {
  castableWhileCasting?: boolean;
}

interface SpellMisc {
  SpellID: number;
  Attributes_4: number;
}

const flag = 0x80;

export default hydrater({
  name: "castableWhileCasting",
  tables: [{ name: "SpellMisc", key: "SpellID" }],
  hydrate(dbc, input): Output {
    const misc = dbc.getTable<SpellMisc, "SpellID">("SpellMisc", "SpellID");
    const row = misc.getFirst(input.id);

    if (row && row.Attributes_4 & flag) {
      return { castableWhileCasting: true };
    }

    return {};
  },
});

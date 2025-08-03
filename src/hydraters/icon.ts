import { hydrater } from "./internal/types.ts";

interface SpellMisc {
  SpellID: number;
  SpellIconFileDataID: number;
}

export interface IconOutput {
  iconID?: number;
}

export default hydrater({
  name: "icon",
  tables: [{ name: "SpellMisc", key: "SpellID" }],
  hydrate(dbc, input): IconOutput {
    const spellMisc = dbc.getTable<SpellMisc>("SpellMisc", "SpellID");

    const entry = spellMisc.getFirst(input.id);

    if (!entry) {
      return {};
    }
    return {
      iconID: entry.SpellIconFileDataID,
    };
  },
});

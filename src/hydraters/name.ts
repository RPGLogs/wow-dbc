import { hydrater } from "./internal/types.ts";

export interface NameOutput {
  name: string;
}

interface SpellName {
  ID: number;
  Name_lang: string;
}

export default hydrater({
  name: "name",
  tables: [{ name: "SpellName", key: "ID" }],
  hydrate(dbc, input): NameOutput {
    const names = dbc.getTable<SpellName, "ID">("SpellName", "ID");
    const name = names.getFirst(input.id)?.Name_lang;
    return {
      name: name ?? "Unknown",
    };
  },
});

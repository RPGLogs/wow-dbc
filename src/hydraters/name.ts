import { hydrater } from "../types.ts";

interface Output {
  name: string;
}

export default hydrater({
  name: "name",
  async hydrate(dbc, input): Promise<Output> {
    const names = await dbc.getTable<{ ID: number; Name_lang: string }>(
      "SpellName",
    );
    const name = names.find(({ ID }) => ID === input.id)?.Name_lang;
    return {
      name: name ?? "Unknown",
    };
  },
});

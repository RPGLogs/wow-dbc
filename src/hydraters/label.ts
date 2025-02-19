import { hydrater } from "../types.ts";

interface Output {
  label?: number[];
}

interface SpellLabel {
  SpellID: number;
  LabelID: number;
}

export default hydrater({
  name: "label",
  tables: [{ name: "SpellLabel", key: "SpellID" }],
  hydrate(dbc, input, spellList): Output {
    const spellLabel = dbc.getTable<SpellLabel>("SpellLabel", "SpellID");
    const labels = spellLabel.getAll(input.id);
    if (labels.length === 0) {
      return {};
    }

    return { label: labels.map(({ LabelID }) => LabelID) };
  },
});

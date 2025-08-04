import { hydrater } from "./internal/types.ts";

export interface LabelOutput {
  label?: number[];
}

interface SpellLabel {
  SpellID: number;
  LabelID: number;
}

/**
 * Retrieve the *labels* of a spell. Spell labels are machine-readable numeric identifiers, *not* human-readable category strings.
 */
export default hydrater({
  name: "label",
  tables: [{ name: "SpellLabel", key: "SpellID" }],
  hydrate(dbc, input): LabelOutput {
    const spellLabel = dbc.getTable<SpellLabel>("SpellLabel", "SpellID");
    const labels = spellLabel.getAll(input.id);
    if (labels.length === 0) {
      return {};
    }

    return { label: labels.map(({ LabelID }) => LabelID) };
  },
});

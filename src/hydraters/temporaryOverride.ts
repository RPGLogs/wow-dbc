import classMask, { matchesClassMask } from "./classMask.ts";
import { EffectType, type SpellEffectRaw as SpellEffect } from "./effects.ts";
import { hydrater } from "./internal/types.ts";

export interface TemporaryOverrideOutput {
  overrides?: number;
}

export default hydrater({
  name: "temporaryOverride",
  tables: [{ name: "SpellEffect", key: "SpellID" }],
  dependencies: { classMask },
  hydrate(dbc, input, allSpells): TemporaryOverrideOutput {
    if (input.type !== "temporary") {
      return {};
    }
    const source = input.grantedBy;
    const effects = dbc.getTable<SpellEffect, "SpellID">(
      "SpellEffect",
      "SpellID",
    );
    const overrides = effects
      .getAll(source)
      .filter(
        (effect) =>
          effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
          effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED,
      );

    for (const override of overrides) {
      if (
        override.EffectBasePointsF === input.id ||
        override.EffectBasePoints === input.id
      ) {
        const overriddenSpells = allSpells
          .values()
          .filter((spell) =>
            matchesClassMask(spell, [
              override.EffectSpellClassMask_0,
              override.EffectSpellClassMask_1,
              override.EffectSpellClassMask_2,
              override.EffectSpellClassMask_3,
            ]),
          )
          .filter((spell) => spell.id !== input.id);

        const first = Array.from(overriddenSpells)[0];

        if (first) {
          return { overrides: first.id };
        }
      }
    }
    return {};
  },
});

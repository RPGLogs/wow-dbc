import classMask, { matchesClassMask } from "./classMask.js";
import { EffectType } from "./effects.js";
import { hydrater } from "./internal/types.js";
export default hydrater({
    name: "temporaryOverride",
    tables: [{ name: "SpellEffect", key: "SpellID" }],
    dependencies: { classMask },
    hydrate(dbc, input, allSpells) {
        if (input.type !== "temporary") {
            return {};
        }
        const source = input.grantedBy;
        const effects = dbc.getTable("SpellEffect", "SpellID");
        const overrides = effects
            .getAll(source)
            .filter((effect) => effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
            effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED);
        for (const override of overrides) {
            if (override.EffectBasePointsF === input.id ||
                override.EffectBasePoints === input.id) {
                const overriddenSpells = allSpells
                    .values()
                    .filter((spell) => matchesClassMask(spell, [
                    override.EffectSpellClassMask_0,
                    override.EffectSpellClassMask_1,
                    override.EffectSpellClassMask_2,
                    override.EffectSpellClassMask_3,
                ]))
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

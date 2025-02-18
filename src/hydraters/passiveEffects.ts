import { keyByMultiple } from "../dbc.ts";
import { hydrater, SpellSource } from "../types.ts";
import classMask, { matchesClassMask } from "./classMask.ts";
import passive from "./passive.ts";

interface SpellEffect {
  sourceSpellId: number;
  aura: number;
  misc0: number;
  basePoints: number;
}

interface Output {
  passiveEffects: SpellEffect[];
}

interface SpellEffectRaw {
  SpellID: number;
  EffectSpellClassMask_0: number;
  EffectSpellClassMask_1: number;
  EffectSpellClassMask_2: number;
  EffectSpellClassMask_3: number;
  EffectAura: number;
  EffectMiscValue_0: number;
  EffectBasePointsF: number;
}

export default hydrater({
  name: "passiveEffects",
  dependencies: { passive, classMask },
  cache: undefined,
  async hydrate(dbc, input, spellList): Promise<Output> {
    if (!this.cache) {
      const spellEffect = await dbc.getTable<SpellEffectRaw>("SpellEffect");
      this.cache = keyByMultiple(spellEffect, "SpellID");
    }
    const effectLookup: Map<number, SpellEffectRaw[]> = this.cache;

    const passives = spellList.filter(
      (spell) =>
        spell.passive &&
        (spell.source === SpellSource.Class ||
          spell.source === SpellSource.Spec),
    );

    const outputEffects: SpellEffect[] = [];
    for (const passive of passives) {
      const effects = effectLookup.get(passive.id);
      if (!effects) {
        continue;
      }
      for (const effect of effects) {
        if (
          !matchesClassMask(input, [
            effect.EffectSpellClassMask_0,
            effect.EffectSpellClassMask_1,
            effect.EffectSpellClassMask_2,
            effect.EffectSpellClassMask_3,
          ])
        ) {
          continue;
        }

        outputEffects.push({
          sourceSpellId: passive.id,
          aura: effect.EffectAura,
          basePoints: effect.EffectBasePointsF,
          misc0: effect.EffectMiscValue_0,
        });
      }
    }
    return {
      passiveEffects: outputEffects,
    };
  },
});

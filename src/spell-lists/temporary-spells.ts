import type { Dbc, Table } from "../dbc.ts";
import { EffectType } from "../hydraters/effects.ts";
import {
  SpellType,
  type AnySpell,
  type TemporarySpell,
} from "../hydraters/internal/types.ts";

interface SpellEffectGrant {
  SpellID: number;
  EffectBasePointsF: number;
  // mists doesn't have the F :)
  EffectBasePoints: number;
  EffectAura: number;
  Effect: number;
  EffectTriggerSpell: number;
}

/**
 * Extract temporary spells from spell effects. This will recurse at most once to find additional spells granted by those spells.
 */
function extractTemporarySpells(
  spellEffect: Table<SpellEffectGrant, keyof SpellEffectGrant>,
  spell: AnySpell,
  recurse = true,
): TemporarySpell[] {
  const effects = spellEffect.getAll(spell.id);

  const overrideSpells = effects
    .filter(
      (effect) =>
        effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS ||
        effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS_TRIGGERED,
    )
    // some override effects have been left in the dbc that don't *do* anything
    .filter(
      (effect) => effect.EffectBasePoints > 0 || effect.EffectBasePointsF > 0,
    )
    .map(
      (effect) =>
        ({
          id:
            effect.EffectBasePointsF === 0
              ? effect.EffectBasePoints
              : effect.EffectBasePointsF,
          grantedBy: spell.id,
          type: SpellType.Temporary,
        }) satisfies TemporarySpell,
    );

  // should this include periodic triggered spells?
  const triggeredSpells = effects
    .filter(
      (effect) =>
        effect.Effect === EffectType.TRIGGER_SPELL && effect.EffectTriggerSpell,
    )
    .map((effect) => ({
      id: effect.EffectTriggerSpell,
      grantedBy: spell.id,
      type: SpellType.Temporary,
    }));

  const result = overrideSpells.concat(triggeredSpells);
  if (recurse) {
    return result.concat(
      result.flatMap((spell) =>
        extractTemporarySpells(spellEffect, spell, false),
      ),
    );
  } else {
    return result;
  }
}

export default async function temporarySpells(
  dbc: Dbc,
  otherSpells: AnySpell[],
): Promise<TemporarySpell[]> {
  const spellEffect = await dbc.loadTable<SpellEffectGrant>(
    "SpellEffect",
    "SpellID",
  );

  return otherSpells.flatMap((spell) =>
    extractTemporarySpells(spellEffect, spell),
  );
}

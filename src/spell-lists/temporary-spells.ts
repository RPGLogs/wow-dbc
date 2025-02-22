import type { Dbc } from "../dbc.ts";
import { EffectType } from "../hydraters/effects.ts";
import {
  SpellType,
  type AnySpell,
  type TemporarySpell,
} from "../hydraters/internal/types.ts";

interface SpellEffectGrant {
  SpellID: number;
  EffectBasePointsF: number;
  EffectAura: number;
}

export default async function temporarySpells(
  dbc: Dbc,
  otherSpells: AnySpell[],
): Promise<TemporarySpell[]> {
  const spellEffect = await dbc.loadTable<SpellEffectGrant>(
    "SpellEffect",
    "SpellID",
  );

  return otherSpells.flatMap((spell) => {
    const effects = spellEffect.getAll(spell.id);

    return effects
      .filter(
        (effect) => effect.EffectAura === EffectType.OVERRIDE_ACTIONBAR_SPELLS,
      )
      .map(
        (effect) =>
          ({
            id: effect.EffectBasePointsF,
            grantedBy: spell.id,
            type: SpellType.Temporary,
          }) satisfies TemporarySpell,
      );
  });
}

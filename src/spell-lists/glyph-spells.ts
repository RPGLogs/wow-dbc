import { type Dbc } from "../dbc.ts";
import { EffectType } from "../hydraters/effects.ts";
import type { GlyphSpell } from "../hydraters/internal/types.ts";

interface GlyphProperties {
  ID: number;
  SpellID: number;
}
interface SpellEffect {
  SpellID: number;
  Effect: number;
  EffectMiscValue_0: number;
}
interface Item {
  ID: number;
  ClassID: number;
  SubclassID: number;
}
interface ItemEffect {
  ID: number;
  ParentItemID: number;
  SpellID: number;
  TriggerType: number;
}

const ITEM_CLASS_GLYPH = 16;
const TRIGGER_TYPE_ON_LEARN = 6;

export default async function glyphSpells(
  dbc: Dbc,
  classId: number,
): Promise<GlyphSpell[]> {
  const items = await dbc.loadTable<Item, "ClassID">("Item", "ClassID");
  const glyphs = items.getAll(ITEM_CLASS_GLYPH);
  const classGlyphs = glyphs.filter((glyph) => glyph.SubclassID === classId);

  const itemEffects = await dbc.loadTable<ItemEffect, "ParentItemID">(
    "ItemEffect",
    "ParentItemID",
  );
  const spellEffects = await dbc.loadTable<SpellEffect, "SpellID">(
    "SpellEffect",
    "SpellID",
  );
  const glyphProps = await dbc.loadTable<GlyphProperties, "ID">(
    "GlyphProperties",
    "ID",
  );

  const taughtSpells: GlyphSpell[] = [];

  for (const glyphItem of classGlyphs) {
    const effects = itemEffects.getAll(glyphItem.ID);
    const glyphSpells = effects.filter(
      (effect) => effect.TriggerType === TRIGGER_TYPE_ON_LEARN,
    );

    for (const spell of glyphSpells) {
      const effects = spellEffects.getAll(spell.SpellID);

      for (const effect of effects) {
        if (effect.Effect === EffectType.APPLY_GLYPH) {
          const glyphId = effect.EffectMiscValue_0;

          const props = glyphProps.getFirst(glyphId);
          if (props) {
            taughtSpells.push({
              type: "glyph",
              id: props.SpellID,
              glyphId,
              glyphItemId: glyphItem.ID,
            });
          }
        }
      }
    }
  }

  return taughtSpells;
}

import {} from "../dbc.js";
import { EffectType } from "../hydraters/effects.js";
const ITEM_CLASS_GLYPH = 16;
const TRIGGER_TYPE_ON_LEARN = 6;
export default async function glyphSpells(dbc, classId) {
    const items = await dbc.loadTable("Item", "ClassID");
    const glyphs = items.getAll(ITEM_CLASS_GLYPH);
    const classGlyphs = glyphs.filter((glyph) => glyph.SubclassID === classId);
    const itemEffects = await dbc.loadTable("ItemEffect", "ParentItemID");
    const spellEffects = await dbc.loadTable("SpellEffect", "SpellID");
    const glyphProps = await dbc.loadTable("GlyphProperties", "ID");
    const taughtSpells = [];
    for (const glyphItem of classGlyphs) {
        const effects = itemEffects.getAll(glyphItem.ID);
        const glyphSpells = effects.filter((effect) => effect.TriggerType === TRIGGER_TYPE_ON_LEARN);
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

import { hydrater } from "./internal/types.ts";

interface Output {
  /**
   * Whether the spell is a passive effect.
   */
  passive: boolean;
  /**
   * Whether the spell is hidden. Hidden passives are used to apply a bunch of modifiers, so they are relevant even if invisible.
   */
  hidden?: "always" | "unless-learned";
}

interface SpellMisc {
  SpellID: number;
  Attributes_0: number;
  Attributes_4: number;
  Attributes_8: number;
}

export default hydrater({
  name: "passive",
  tables: [
    {
      name: "SpellMisc",
      key: "SpellID",
    },
  ],
  hydrate(dbc, input): Output {
    const spellMisc = dbc.getTable<SpellMisc>("SpellMisc", "SpellID");

    if (!spellMisc.getFirst(input.id)) {
      return {
        passive: false,
      };
    }

    const { Attributes_0, Attributes_4, Attributes_8 } = spellMisc.getFirst(
      input.id,
    );

    let hidden = undefined;
    if (Attributes_8 & NOT_IN_SPELLBOOK_UNLESS_LEARNED_FLAG) {
      hidden = "unless-learned";
    }
    // assume that both flags may be set at once.
    if (
      Attributes_0 & DO_NOT_DISPLAY_FLAG ||
      Attributes_4 & NOT_IN_SPELLBOOK_FLAG
    ) {
      hidden = "always";
    }

    return {
      passive: Boolean(Attributes_0 & PASSIVE_FLAG),
      hidden,
    };
  },
});

const PASSIVE_FLAG = 0x40;
const DO_NOT_DISPLAY_FLAG = 0x80;
const NOT_IN_SPELLBOOK_FLAG = 0x8000;
const NOT_IN_SPELLBOOK_UNLESS_LEARNED_FLAG = 0x2000;

import { keyBy } from "../dbc.ts";
import { hydrater } from "../types.ts";
import name from "./name.ts";

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
  cache: undefined,
  dependencies: { name },
  async hydrate(dbc, input): Promise<Output> {
    // spellmisc is really big so we are putting extra effort into not re-keying it.
    const spellMisc: Map<number, SpellMisc> = this.cache
      ? this.cache
      : keyBy(await dbc.getTable<SpellMisc>("SpellMisc"), "SpellID");
    if (!this.cache) {
      this.cache = spellMisc;
    }

    if (!spellMisc.has(input.id)) {
      return {
        passive: false,
      };
    }

    const { Attributes_0, Attributes_4, Attributes_8 } = spellMisc.get(
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

import { hydrater } from "./internal/types.ts";

interface Output {
  castTime?: {
    duration: number;
  };
}

interface SpellMisc {
  SpellID: number;
  CastingTimeIndex: number;
}

interface SpellCastTimes {
  ID: number;
  Base: number;
  Minimum: number;
}

export default hydrater({
  name: "castTime",
  tables: [
    { name: "SpellMisc", key: "SpellID" },
    { name: "SpellCastTimes", key: "ID" },
  ],
  hydrate(dbc, input, spellList): Output {
    const spellMisc = dbc.getTable<SpellMisc>("SpellMisc", "SpellID");
    const misc = spellMisc.getFirst(input.id);
    if (!misc || misc.CastingTimeIndex === 0) {
      return {};
    }

    const spellCastTimes = dbc.getTable<SpellCastTimes>("SpellCastTimes", "ID");
    const castTime = spellCastTimes.getFirst(misc.CastingTimeIndex);
    if (!castTime || castTime.Base === 0) {
      return {};
    }

    // TODO: cast time modification effects

    return {
      castTime: {
        duration: castTime.Base,
      },
    };
  },
});

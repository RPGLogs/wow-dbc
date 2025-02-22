import { hydrater } from "./internal/types.ts";
import effects, { EffectType } from "./effects.ts";

interface Output {
  channel?: {
    duration: number;
    hasted: boolean;
    buffIsLogged: boolean;
    triggeredSpells?: {
      spell: number;
      period: number;
      hasted: boolean;
    }[];
  };
}

interface SpellMisc {
  SpellID: number;
  Attributes_1: number;
  Attributes_5: number;
  Attributes_6: number;
  Attributes_8: number;
  DurationIndex: number;
}

interface SpellDuration {
  ID: number;
  Duration: number;
}

export default hydrater({
  name: "channel",
  dependencies: { effects },
  tables: [
    { name: "SpellMisc", key: "SpellID" },
    { name: "SpellDuration", key: "ID" },
  ],
  hydrate(dbc, input): Output {
    const spellMisc = dbc.getTable<SpellMisc>("SpellMisc", "SpellID");
    const misc = spellMisc.getFirst(input.id);
    if (!misc) {
      return {};
    }

    const isChannel = Boolean(misc.Attributes_1 & 0x4);
    if (!isChannel) {
      return {};
    }

    const spellDuration = dbc.getTable<SpellDuration>("SpellDuration", "ID");
    const duration = spellDuration.getFirst(misc.DurationIndex);
    if (!duration) {
      console.warn(`no duration found for channeled spell ${input.id}`);
    }

    // there are two separate flags. one for the periodic trigger being hasted, and one for the duration being hasted.
    const hasted = Boolean(misc.Attributes_8 & 0x20000);

    const periodicHasted = Boolean(misc.Attributes_5 & 0x2000);
    const triggeredSpells = input.effects
      .filter(
        (effect) =>
          effect.aura === EffectType.PERIODIC_TRIGGER_SPELL &&
          effect.triggeredSpell,
      )
      .map((effect) => ({
        spell: effect.triggeredSpell,
        period: effect.period,
        hasted: periodicHasted,
      }));

    const buffIsLogged = !Boolean(misc.Attributes_6 & 0x400);

    // TODO: there are probably effects that adjust the duration or modify the trigger period

    return {
      channel: {
        duration: duration?.Duration ?? -1,
        hasted,
        buffIsLogged,
        triggeredSpells,
      },
    };
  },
});

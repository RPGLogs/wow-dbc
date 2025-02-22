import type { Dbc } from "./src/dbc.ts";
import castTime from "./src/hydraters/castTime.ts";
import channel from "./src/hydraters/channel.ts";
import charges from "./src/hydraters/charges.ts";
import cooldown from "./src/hydraters/cooldown.ts";
import gcd from "./src/hydraters/gcd.ts";
import {
  doHydration,
  type FinalOutput,
  type Hydrater,
} from "./src/hydraters/index.ts";
import type { AnySpell } from "./src/hydraters/internal/types.ts";
import name from "./src/hydraters/name.ts";
import passive from "./src/hydraters/passive.ts";
import classSpells from "./src/spell-lists/class-spells.ts";
import dragonflightTalentSpells from "./src/spell-lists/df-talent-spells.ts";
import learnedSpells from "./src/spell-lists/learned-spells.ts";
import specSpells from "./src/spell-lists/spec-spells.ts";
import temporarySpells from "./src/spell-lists/temporary-spells.ts";
export { dbc } from "./src/dbc.ts";

const retailSpellPreset = {
  castTime,
  channel,
  charges,
  cooldown,
  gcd,
  name,
  passive,
};

export type RetailSpell = FinalOutput<typeof retailSpellPreset>;
export type HydraterDefinition = Record<string, Hydrater<any, any>>;

export const PRESETS = {
  RETAIL: retailSpellPreset,
} satisfies Record<string, HydraterDefinition>;

export async function loadAll<H extends HydraterDefinition>(
  hydraterDef: H,
  dbc: Dbc,
  spellList: AnySpell[],
): Promise<FinalOutput<H>[]> {
  return doHydration(hydraterDef, dbc, spellList);
}

async function getClassId(
  dbc: Dbc,
  specId: number,
): Promise<number | undefined> {
  const chrSpec = await dbc.loadTable<{ ID: number; ClassID: number }>(
    "ChrSpecialization",
    "ID",
  );
  return chrSpec.getFirst(specId)?.ClassID;
}

export async function retailSpecList(dbc: Dbc): Promise<number[]> {
  const [chrClasses, chrSpec] = await Promise.all([
    dbc.loadTable<{ ID: number; Flags: number }>("ChrClasses", "ID"),
    dbc.loadTable<{ ID: number; ClassID: number }>("ChrSpecialization", "ID"),
  ]);

  return chrSpec
    .contents()
    .filter((spec) => {
      const class_ = chrClasses.getFirst(spec.ClassID);
      const flags = class_?.Flags ?? 0;
      return flags & PLAYER_CLASS_FLAG;
    })
    .map((spec) => spec.ID);
}

const PLAYER_CLASS_FLAG = 0x2;

export async function retailSpellList(
  dbc: Dbc,
  specId: number,
): Promise<AnySpell[]> {
  const classId = await getClassId(dbc, specId);
  if (!classId) {
    throw new Error(`unable to retrieve class for spec id ${specId}`);
  }

  const spellLists = await Promise.all([
    classSpells(dbc, classId),
    specSpells(dbc, specId),
    dragonflightTalentSpells(dbc, classId, specId),
  ]);

  const spellList = spellLists.flat();
  const withLearnedSpells = spellList.concat(
    await learnedSpells(dbc, spellList),
  );
  return withLearnedSpells.concat(
    await temporarySpells(dbc, withLearnedSpells),
  );
}

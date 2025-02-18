import { keyBy, leftJoin, type Dbc } from "../dbc.ts";
import { SpellSource, type BaseSpell } from "../types.ts";
import { classSkillLine } from "./class-spells.ts";

interface TalentSpell extends BaseSpell {
  requiresTalentEntry: number[];
  // TODO
  visibleSpellId?: number;
  overrides?: number;
}

interface SkillLineXTraitTree {
  SkillLineID: number;
  TraitTreeID: number;
}

interface TraitTreeLoadout {
  TraitTreeID: number;
  ChrSpecializationID: number;
  ID: number;
}

interface TraitTreeLoadoutEntry {
  TraitTreeLoadoutID: number;
  SelectedTraitNodeID: number;
}

interface TraitNodeXTraitNodeEntry {
  TraitNodeID: number;
  TraitNodeEntryID: number;
}

interface TraitNodeEntry {
  ID: number;
  TraitDefinitionID: number;
}
interface TraitDefinition {
  ID: number;
  SpellID: number;
  OverridesSpellID: number;
  VisibleSpellID: number;
}

export default async function dragonflightTalentSpells(
  dbc: Dbc,
  classId: number,
  specId: number,
): Promise<TalentSpell[]> {
  const skillLineId = await classSkillLine(dbc, classId);
  if (!skillLineId) {
    return [];
  }

  const skillLineToTraitTree = await dbc.getTable<SkillLineXTraitTree>(
    "SkillLineXTraitTree",
  );
  const traitTreeID = skillLineToTraitTree.find(
    ({ SkillLineID }) => SkillLineID === skillLineId,
  )?.TraitTreeID;

  if (!traitTreeID) {
    return [];
  }

  const traitLoadouts =
    await dbc.getTable<TraitTreeLoadout>("TraitTreeLoadout");
  const traitLoadoutId = traitLoadouts.find(
    ({ TraitTreeID, ChrSpecializationID }) =>
      TraitTreeID === traitTreeID && ChrSpecializationID === specId,
  )?.ID;

  if (!traitLoadoutId) {
    return [];
  }

  const traitTreeLoadoutEntries = await dbc.getTable<TraitTreeLoadoutEntry>(
    "TraitTreeLoadoutEntry",
  );
  const loadoutNodes = traitTreeLoadoutEntries.filter(
    ({ TraitTreeLoadoutID }) => TraitTreeLoadoutID === traitLoadoutId,
  );

  const traitNodesToEntries = await dbc.getTable<TraitNodeXTraitNodeEntry>(
    "TraitNodeXTraitNodeEntry",
  );
  const traitEntries = await dbc.getTable<TraitNodeEntry>("TraitNodeEntry");
  const traitDefinitions =
    await dbc.getTable<TraitDefinition>("TraitDefinition");
  const specEntries = leftJoin(
    traitNodesToEntries,
    "TraitNodeEntryID",
    traitEntries,
    "ID",
  )
    .filter(({ right }) => right !== undefined)
    .map(({ right }) => right);
  const allEntries = leftJoin(
    specEntries,
    "TraitDefinitionID",
    traitDefinitions,
    "ID",
  )
    .filter(({ right }) => right !== undefined)
    .filter(({ right: { SpellID } }) => SpellID > 0)
    .map(
      ({
        left: { ID },
        right: { SpellID, VisibleSpellID, OverridesSpellID },
      }) => ({
        id: SpellID,
        requiresTalentEntry: [ID],
        visibleSpellId: VisibleSpellID > 0 ? VisibleSpellID : undefined,
        overrides: OverridesSpellID > 0 ? OverridesSpellID : undefined,
        source: SpellSource.Talent,
      }),
    );

  // now we have to handle spells that show up repeatedly
  const result: Map<number, TalentSpell> = new Map();
  for (const entry of allEntries) {
    if (!result.has(entry.id)) {
      result.set(entry.id, entry);
    } else {
      result
        .get(entry.id)!
        .requiresTalentEntry.push(...entry.requiresTalentEntry);
    }
  }

  return Array.from(result.values());
}

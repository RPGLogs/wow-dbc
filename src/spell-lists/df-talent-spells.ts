import { type Dbc } from "../dbc.ts";
import { SpellType, type BaseSpell } from "../types.ts";
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

  const skillLineToTraitTree = await dbc.loadTable<SkillLineXTraitTree>(
    "SkillLineXTraitTree",
    "SkillLineID",
  );
  const traitTreeID = skillLineToTraitTree.getFirst(skillLineId)?.TraitTreeID;

  if (!traitTreeID) {
    return [];
  }

  const traitLoadouts = await dbc.loadTable<TraitTreeLoadout>(
    "TraitTreeLoadout",
    "ChrSpecializationID",
  );
  const traitLoadoutId = traitLoadouts
    .getAll(specId)
    .find(({ TraitTreeID }) => TraitTreeID === traitTreeID)?.ID;

  if (!traitLoadoutId) {
    return [];
  }

  const traitTreeLoadoutEntries = await dbc.loadTable<TraitTreeLoadoutEntry>(
    "TraitTreeLoadoutEntry",
    "TraitTreeLoadoutID",
  );
  const loadoutNodes = traitTreeLoadoutEntries.getAll(traitLoadoutId);

  const traitNodesToEntries = await dbc.loadTable<
    TraitNodeXTraitNodeEntry,
    "TraitNodeID"
  >("TraitNodeXTraitNodeEntry", "TraitNodeID");
  const traitEntries = await dbc.loadTable<TraitNodeEntry>(
    "TraitNodeEntry",
    "ID",
  );
  const traitDefinitions = await dbc.loadTable<TraitDefinition>(
    "TraitDefinition",
    "ID",
  );

  const specEntries = loadoutNodes
    .flatMap((node) => {
      const entryLinks = traitNodesToEntries.getAll(node.SelectedTraitNodeID);
      if (entryLinks.length === 0) {
        return [];
      }

      return entryLinks.map((entryLink) => {
        const entry = traitEntries.getFirst(entryLink.TraitNodeEntryID);
        if (!entry) {
          return undefined;
        }

        const definition = traitDefinitions.getFirst(entry.TraitDefinitionID);

        if (!definition) {
          return undefined;
        }
        return {
          id: definition.SpellID,
          requiresTalentEntry: [entry.ID],
          visibleSpellId:
            definition.VisibleSpellID > 0
              ? definition.VisibleSpellID
              : undefined,
          overrides:
            definition.OverridesSpellID > 0
              ? definition.OverridesSpellID
              : undefined,
          type: SpellType.Talent,
        };
      });
    })
    .filter((record) => record !== undefined);

  // now we have to handle spells that show up repeatedly
  const result: Map<number, TalentSpell> = new Map();
  for (const entry of specEntries) {
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

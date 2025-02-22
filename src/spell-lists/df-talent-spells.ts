import { type Dbc } from "../dbc.ts";
import { SpellType, type BaseSpell } from "../hydraters/internal/types.ts";
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

interface TraitCond {
  ID: number;
  SpecSetID: number;
  TraitNodeID: number;
  TraitTreeID: number;
}

interface TraitNodeXTraitCond {
  TraitNodeID: number;
  TraitCondID: number;
}

interface TraitTreeLoadout {
  TraitTreeID: number;
  ChrSpecializationID: number;
  ID: number;
}

interface SpecSetMember {
  SpecSet: number;
  ChrSpecializationID: number;
}

interface TraitTreeLoadoutEntry {
  TraitTreeLoadoutID: number;
  SelectedTraitNodeID: number;
}

interface TraitNodeXTraitNodeEntry {
  TraitNodeID: number;
  TraitNodeEntryID: number;
}

interface TraitNode {
  ID: number;
  TraitTreeID: number;
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

  const traitNodes = await dbc.loadTable<TraitNode>("TraitNode", "TraitTreeID");
  const allNodes = traitNodes.getAll(traitTreeID);

  const traitCond = await dbc.loadTable<TraitCond>("TraitCond", "ID");
  const traitNodesToConds = await dbc.loadTable<TraitNodeXTraitCond>(
    "TraitNodeXTraitCond",
    "TraitNodeID",
  );
  const specSetMember = await dbc.loadTable<SpecSetMember>(
    "SpecSetMember",
    "SpecSet",
  );

  const specNodes = allNodes.filter((node) => {
    const link = traitNodesToConds.getFirst(node.ID);
    if (!link) {
      // guesswork. unconditional
      return true;
    }
    const cond = traitCond.getFirst(link.TraitCondID);
    // not sure what to check besides spec set at this stage
    return specSetMember
      .getAll(cond.SpecSetID)
      .some((member) => member.ChrSpecializationID === specId);
  });

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

  const specEntries = specNodes
    .flatMap((node) => {
      const entryLinks = traitNodesToEntries.getAll(node.ID);
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

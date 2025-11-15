import { type Dbc } from "../dbc.ts";
import { SpellType, type TalentSpell } from "../hydraters/internal/types.ts";
import { classSkillLine } from "./class-spells.ts";

interface SkillLineXTraitTree {
  SkillLineID: number;
  TraitTreeID: number;
}

interface TraitCond {
  ID: number;
  SpecSetID: number;
  TraitNodeID: number;
  TraitTreeID: number;
  CondType: number;
}

interface TraitNodeXTraitCond {
  TraitNodeID: number;
  TraitCondID: number;
}

interface TraitNodeGroupXTraitNode {
  TraitNodeGroupID: number;
  TraitNodeID: number;
}

interface TraitNodeGroupXTraitCond {
  TraitNodeGroupID: number;
  TraitCondID: number;
}

interface SpecSetMember {
  SpecSet: number;
  ChrSpecializationID: number;
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
  const traitNodesToGroups = await dbc.loadTable<TraitNodeGroupXTraitNode>(
    "TraitNodeGroupXTraitNode",
    "TraitNodeID",
  );
  const traitGroupsToConds = await dbc.loadTable<TraitNodeGroupXTraitCond>(
    "TraitNodeGroupXTraitCond",
    "TraitNodeGroupID",
  );
  const specSetMember = await dbc.loadTable<SpecSetMember>(
    "SpecSetMember",
    "SpecSet",
  );

  const specNodes = allNodes.filter((node) => {
    const link = traitNodesToConds.getFirst(node.ID);
    const conds = traitNodesToGroups
      .getAll(node.ID)
      .flatMap((group) => traitGroupsToConds.getAll(group.TraitNodeGroupID))
      .map((link) => traitCond.getFirst(link.TraitCondID));

    if (link) {
      conds.push(traitCond.getFirst(link.TraitCondID));
    }

    if (conds.length === 0) {
      return true; // no conditions found, assume unconditional
    }

    if (conds.every((cond) => cond === undefined)) {
      return false;
    }

    // it appears that conditions may be ORs? or at least the spec subset of them probably is.
    // hero tree nodes have multiple conditions with distinct (non-overlapping) spec sets.
    const validSpecs = new Set(
      conds
        .filter((cond): cond is TraitCond => Boolean(cond))
        .flatMap((cond) =>
          cond.SpecSetID === 0 ? [] : specSetMember.getAll(cond.SpecSetID),
        )
        .map((member) => member.ChrSpecializationID),
    );
    return validSpecs.has(specId);
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

      const group = traitNodesToGroups.getAll(node.ID);
      const isGranted = group
        .flatMap((g) => traitGroupsToConds.getAll(g.TraitNodeGroupID))
        .flatMap((link) => traitCond.getAll(link.TraitCondID))
        .filter((cond) => cond.CondType === COND_GRANTED)
        .some((cond) =>
          specSetMember
            .getAll(cond.SpecSetID)
            .some((member) => member.ChrSpecializationID === specId),
        );

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
          granted: isGranted,
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

const COND_GRANTED = 2;

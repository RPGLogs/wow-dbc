import {} from "../dbc.js";
import { SpellType } from "../hydraters/internal/types.js";
import { classSkillLine } from "./class-spells.js";
export default async function dragonflightTalentSpells(dbc, classId, specId) {
    const skillLineId = await classSkillLine(dbc, classId);
    if (!skillLineId) {
        return [];
    }
    const skillLineToTraitTree = await dbc.loadTable("SkillLineXTraitTree", "SkillLineID");
    const traitTreeID = skillLineToTraitTree.getFirst(skillLineId)?.TraitTreeID;
    if (!traitTreeID) {
        return [];
    }
    const traitNodes = await dbc.loadTable("TraitNode", "TraitTreeID");
    const allNodes = traitNodes.getAll(traitTreeID);
    const traitCond = await dbc.loadTable("TraitCond", "ID");
    const traitNodesToConds = await dbc.loadTable("TraitNodeXTraitCond", "TraitNodeID");
    const traitNodesToGroups = await dbc.loadTable("TraitNodeGroupXTraitNode", "TraitNodeID");
    const traitGroupsToConds = await dbc.loadTable("TraitNodeGroupXTraitCond", "TraitNodeGroupID");
    const specSetMember = await dbc.loadTable("SpecSetMember", "SpecSet");
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
        const validSpecs = new Set(conds
            .filter((cond) => Boolean(cond))
            .flatMap((cond) => cond.SpecSetID === 0 ? [] : specSetMember.getAll(cond.SpecSetID))
            .map((member) => member.ChrSpecializationID));
        return validSpecs.has(specId);
    });
    const traitNodesToEntries = await dbc.loadTable("TraitNodeXTraitNodeEntry", "TraitNodeID");
    const traitEntries = await dbc.loadTable("TraitNodeEntry", "ID");
    const traitDefinitions = await dbc.loadTable("TraitDefinition", "ID");
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
            .some((cond) => specSetMember
            .getAll(cond.SpecSetID)
            .some((member) => member.ChrSpecializationID === specId));
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
                visibleSpellId: definition.VisibleSpellID > 0
                    ? definition.VisibleSpellID
                    : undefined,
                overrides: definition.OverridesSpellID > 0
                    ? definition.OverridesSpellID
                    : undefined,
                type: SpellType.Talent,
            };
        });
    })
        .filter((record) => record !== undefined);
    // now we have to handle spells that show up repeatedly
    const result = new Map();
    for (const entry of specEntries) {
        if (!result.has(entry.id)) {
            result.set(entry.id, entry);
        }
        else {
            result
                .get(entry.id)
                .requiresTalentEntry.push(...entry.requiresTalentEntry);
        }
    }
    return Array.from(result.values());
}
const COND_GRANTED = 2;

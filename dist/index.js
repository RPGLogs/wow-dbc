import castTime from "./src/hydraters/castTime.js";
import channel from "./src/hydraters/channel.js";
import charges from "./src/hydraters/charges.js";
import cooldown from "./src/hydraters/cooldown.js";
import castableWhileCasting from "./src/hydraters/castableWhileCasting.js";
import gcd from "./src/hydraters/gcd.js";
import { doHydration } from "./src/hydraters/index.js";
import name from "./src/hydraters/name.js";
import passive from "./src/hydraters/passive.js";
import classSpells from "./src/spell-lists/class-spells.js";
import dragonflightTalentSpells from "./src/spell-lists/df-talent-spells.js";
import learnedSpells from "./src/spell-lists/learned-spells.js";
import specSpells from "./src/spell-lists/spec-spells.js";
import temporarySpells from "./src/spell-lists/temporary-spells.js";
import mistsTalentSpells from "./src/spell-lists/mists-talent-spells.js";
import icon from "./src/hydraters/icon.js";
export { dbc } from "./src/dbc.js";
const retailSpellPreset = {
    castTime,
    channel,
    charges,
    cooldown,
    gcd,
    name,
    passive,
    castableWhileCasting,
    icon,
};
export const PRESETS = {
    RETAIL: retailSpellPreset,
};
export async function loadAll(hydraterDef, dbc, spellList) {
    return doHydration(hydraterDef, dbc, spellList);
}
async function getClassId(dbc, specId) {
    const chrSpec = await dbc.loadTable("ChrSpecialization", "ID");
    return chrSpec.getFirst(specId)?.ClassID;
}
export async function retailSpecList(dbc) {
    const [chrClasses, chrSpec] = await Promise.all([
        dbc.loadTable("ChrClasses", "ID"),
        dbc.loadTable("ChrSpecialization", "ID"),
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
export async function retailSpellList(dbc, specId) {
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
    const withLearnedSpells = spellList.concat(await learnedSpells(dbc, spellList));
    return withLearnedSpells.concat(await temporarySpells(dbc, withLearnedSpells));
}
export async function classicSpellList(dbc, specId) {
    const classId = await getClassId(dbc, specId);
    if (!classId) {
        throw new Error(`unable to retrieve class for spec id ${specId}`);
    }
    const spellLists = await Promise.all([
        classSpells(dbc, classId),
        specSpells(dbc, specId),
        mistsTalentSpells(dbc, classId, specId),
    ]);
    const spellList = spellLists.flat();
    const withLearnedSpells = spellList.concat(await learnedSpells(dbc, spellList));
    return withLearnedSpells.concat(await temporarySpells(dbc, withLearnedSpells));
}
export async function getSpecIdByName(dbc, className, specName) {
    const chrClasses = await dbc.loadTable("ChrClasses", "Filename");
    const cls = chrClasses.getFirst(className.toUpperCase());
    if (!cls) {
        return undefined;
    }
    const chrSpec = await dbc.loadTable("ChrSpecialization", "ID");
    for (const spec of chrSpec.contents()) {
        if (spec.ClassID === cls.ID &&
            spec.Name_lang.toUpperCase() === specName.toUpperCase()) {
            return spec.ID;
        }
    }
    return undefined;
}

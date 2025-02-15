import * as fs from "node:fs/promises";
import * as path from "node:path";
import pl, { Int64 } from "nodejs-polars";

const cacheDir = path.join(import.meta.dirname, ".table-cache");

function cachePath(key: string): string {
  return path.join(cacheDir, encodeURIComponent(key) + ".csv");
}

const MEMORY_CACHE = {};

async function loadCachedTable(key: string): Promise<Buffer | undefined> {
  if (MEMORY_CACHE[key]) {
    return MEMORY_CACHE[key];
  }
  try {
    const file = await fs.open(cachePath(key), "r");
    const text = await file.readFile();
    await file.close();
    return text;
  } catch {
    return undefined;
  }
}

async function storeCachedTable(key: string, data: string): Promise<void> {
  MEMORY_CACHE[key] = data;
  await fs.mkdir(cacheDir, { recursive: true });
  const file = await fs.open(cachePath(key), "w");
  await file.writeFile(data);
  await file.close();
}

/**
 * Get table data in raw CSV form. This will request from wago.tools if needed and cache on disk.
 */
async function getTableData(
  tableName: string,
  buildVersion: string,
  filter?: Record<string, string>,
): Promise<string> {
  const url = new URL(`https://wago.tools/db2/${tableName}/csv`);
  url.searchParams.append("build", buildVersion);
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      url.searchParams.append(`filter[${key}]`, value);
    }
  }
  const cached = await loadCachedTable(url.toString());
  if (cached) {
    return cached.toString("utf8");
  }
  const res = await fetch(url);
  const body = await res.text();
  await storeCachedTable(url.toString(), body);
  return body;
}

export async function table(
  name: string,
  buildVersion: string,
  requestFilters?: Record<string, string>,
): Promise<pl.DataFrame | undefined> {
  const rawCsv = await getTableData(name, buildVersion, requestFilters);
  return pl.readCSV(rawCsv, {
    hasHeader: true,
    quoteChar: '"',
    dtypes: { ID: pl.DataType.Int64 },
  });
}

const RETAIL_VERSION = "11.1.0.59095";

enum ReferenceType {
  /**
   * Simple equality matching
   */
  Direct = "direct",
  /**
   * match if (source.column & foreign.column) != 0
   */
  BitField = "bitfield",
}

interface ColumnRef {
  table: string;
  column: string;
  referenceType?: ReferenceType;
}

interface ReferenceDef {
  source: ColumnRef;
  foreign: ColumnRef;
}

const spellReferencesPartial: ColumnRef[] = [
  {
    table: "SpellName",
    column: "ID",
  },
  {
    table: "SkillLineAbility",
    column: "Spell",
  },
  {
    table: "SpellReplacement",
    column: "SpellID",
  },
  {
    table: "SpellReplacement",
    column: "ReplacementSpellID",
  },
  {
    table: "SpellMisc",
    column: "SpellID",
  },
  {
    table: "SpellLevels",
    column: "SpellID",
  },
  {
    table: "SpellClassOptions",
    column: "SpellID",
  },
  {
    table: "SpellCategories",
    column: "SpellID",
  },
  {
    table: "SpellEffect",
    column: "SpellID",
  },
  {
    table: "SpellCooldowns",
    column: "SpellID",
  },
  {
    table: "SpellLabel",
    column: "SpellID",
  },
  {
    table: "SpellPower",
    column: "SpellID",
  },
  {
    table: "SpecializationSpells",
    column: "SpellID",
  },
  {
    table: "SpecializationSpells",
    column: "OverridesSpellID",
  },
  {
    table: "TraitDefinition",
    column: "SpellID",
  },
  {
    table: "TraitDefinition",
    column: "OverridesSpellID",
  },
  {
    table: "TraitDefinition",
    column: "VisibleSpellID",
  },
];

const spellReferences: ReferenceDef[] = spellReferencesPartial.map(
  (source) => ({ source, foreign: { table: "Spell", column: "ID" } }),
);

const otherReferences: ReferenceDef[] = [
  {
    source: {
      table: "SkillLineAbility",
      column: "SkillLine",
    },
    foreign: {
      table: "SkillLine",
      column: "ID",
    },
  },
  // {
  //   source: {
  //     table: "SpellEffect",
  //     column: "EffectSpellClassMask_0",
  //     referenceType: ReferenceType.BitField,
  //   },
  //   foreign: {
  //     column: "SpellClassMask_0",
  //     table: "SpellClassOptions",
  //     referenceType: ReferenceType.BitField,
  //   },
  // },
  // {
  //   source: {
  //     table: "SpellEffect",
  //     column: "EffectSpellClassMask_1",
  //     referenceType: ReferenceType.BitField,
  //   },
  //   foreign: {
  //     column: "SpellClassMask_1",
  //     table: "SpellClassOptions",
  //     referenceType: ReferenceType.BitField,
  //   },
  // },
  // {
  //   source: {
  //     table: "SpellEffect",
  //     column: "EffectSpellClassMask_2",
  //     referenceType: ReferenceType.BitField,
  //   },
  //   foreign: {
  //     column: "SpellClassMask_2",
  //     table: "SpellClassOptions",
  //     referenceType: ReferenceType.BitField,
  //   },
  // },
  // {
  //   source: {
  //     table: "SpellEffect",
  //     column: "EffectSpellClassMask_3",
  //     referenceType: ReferenceType.BitField,
  //   },
  //   foreign: {
  //     column: "SpellClassMask_3",
  //     table: "SpellClassOptions",
  //     referenceType: ReferenceType.BitField,
  //   },
  // },
];

async function spellList(
  specId: number,
  buildVersion: string,
): Promise<unknown[]> {
  const chrSpecializations = await table("ChrSpecialization", buildVersion);
  const classId = chrSpecializations.where(pl.col("ID").eq(specId)).row(0)[
    chrSpecializations.findIdxByName("ClassID")
  ];
  const skillRaceClassInfo = await table("SkillRaceClassInfo", buildVersion);
  const skillLineId = skillRaceClassInfo
    .where(pl.col("ClassMask").eq(2 ** (classId - 1)))
    .row(0)[skillRaceClassInfo.findIdxByName("SkillID")];

  const skillLineAbilities = await table("SkillLineAbility", buildVersion);
  const classSpellIds: pl.Series<Int64> = skillLineAbilities
    .where(pl.col("SkillLine").eq(skillLineId))
    .getColumn("Spell");
  const specializationSpells = await table(
    "SpecializationSpells",
    buildVersion,
  );
  const specSpellIds: pl.DataFrame<{
    SpellID: pl.Series<Int64>;
    OverridesSpellID: pl.Series<Int64>;
  }> = specializationSpells
    .where(pl.col("SpecID").eq(specId))
    .select("SpellID", "OverridesSpellID");

  const specOverrides = new Set(
    specSpellIds.getColumn("OverridesSpellID").toArray(),
  );
  let allSpells = classSpellIds
    .concat(specSpellIds.getColumn("SpellID"))
    .toArray();
  allSpells = allSpells.filter((spellId) => !specOverrides.has(spellId));

  const skillLineToTraitTree = await table("SkillLineXTraitTree", buildVersion);
  const traitTreeID = skillLineToTraitTree
    .where(pl.col("SkillLineID").eq(skillLineId))
    .row(0)[skillLineToTraitTree.findIdxByName("TraitTreeID")];

  const traitLoadouts = await table("TraitTreeLoadout", buildVersion);
  const traitLoadoutId = traitLoadouts
    .where(
      pl
        .col("TraitTreeID")
        .eq(traitTreeID)
        .and(pl.col("ChrSpecializationID").eq(specId)),
    )
    .getColumn("ID")
    .get(0);

  const traitTreeLoadoutEntries = await table(
    "TraitTreeLoadoutEntry",
    buildVersion,
  );
  const loadoutNodes = traitTreeLoadoutEntries
    .where(pl.col("TraitTreeLoadoutID").eq(traitLoadoutId))
    .getColumn("SelectedTraitNodeID");

  const traitNodesToEntries = await table(
    "TraitNodeXTraitNodeEntry",
    buildVersion,
  );
  const traitEntries = await table("TraitNodeEntry", buildVersion);
  const traitDefinitions = await table("TraitDefinition", buildVersion);
  const specEntries = traitNodesToEntries
    .where(pl.col("TraitNodeID").isIn(loadoutNodes))
    .join(traitEntries, {
      how: "left",
      leftOn: "TraitNodeEntryID",
      rightOn: "ID",
    })
    .select("TraitNodeEntryID", "TraitDefinitionID")
    .join(traitDefinitions, {
      how: "left",
      leftOn: "TraitDefinitionID",
      rightOn: "ID",
    })
    .select(
      "SpellID",
      "TraitNodeEntryID",
      "OverridesSpellID",
      "VisibleSpellID",
    );

  const talentSpells = new Set(specEntries.getColumn("SpellID").toArray());
  const talentOverrides = new Set(
    specEntries.getColumn("OverridesSpellID").toArray(),
  );
  allSpells = allSpells.concat(specEntries.getColumn("SpellID").toArray());
  // note: not removing all talent overrides because you may not have the talents.

  const spellLearnSpell = await table("SpellLearnSpell", buildVersion);
  const learnedSpells: pl.DataFrame<{
    LearnSpellID: pl.Series<Int64>;
    OverridesSpellID: pl.Series<Int64>;
    SpellID: pl.Series<Int64>;
  }> = spellLearnSpell
    .where(pl.col("SpellID").isIn(allSpells))
    .select("LearnSpellID", "OverridesSpellID", "SpellID");

  const learnOverrides = new Set(
    learnedSpells.getColumn("OverridesSpellID").toArray(),
  );
  allSpells = allSpells.concat(
    learnedSpells.getColumn("LearnSpellID").toArray(),
  );

  const spellMisc = await table("SpellMisc", buildVersion);
  const spellCategories = await table("SpellCategories", buildVersion);
  const spellCategory = await table("SpellCategory", buildVersion);
  const spellCooldowns = await table("SpellCooldowns", buildVersion);
  const spellLabel = await table("SpellLabel", buildVersion);

  const spellNames = await table("SpellName", buildVersion);
  const spellData: Map<number, unknown> = new Map();
  const passives = [];
  for (const spellId_ of allSpells) {
    const playerLabel = spellLabel.where(
      pl.col("SpellID").eq(spellId_).and(pl.col("LabelID").eq(16)),
    );
    if (playerLabel.isEmpty()) {
      continue; // not a player spell
    }
    const spellId = Number(spellId_);
    const name = spellNames.where(pl.col("ID").eq(spellId));
    if (name.isEmpty()) {
      continue;
    }
    const spell = {
      id: spellId,
      name: name.getColumn("Name_lang").get(0),
      ifNotSpell: [],
      passiveEffects: [],
      talentEffects: {},
    };
    if (learnOverrides.has(spellId_)) {
      spell.ifNotSpell.push(
        Number(
          learnedSpells
            .where(pl.col("OverridesSpellID").eq(spellId_))
            .getColumn("LearnSpellID")
            .get(0),
        ),
      );
    }
    if (talentSpells.has(spellId_)) {
      spell.ifTalent = Number(
        specEntries
          .where(pl.col("SpellID").eq(spellId_))
          .getColumn("TraitNodeEntryID")
          .get(0),
      );
    }
    if (talentOverrides.has(spellId_)) {
      spell.ifNotSpell.push(
        Number(
          specEntries
            .where(pl.col("OverridesSpellID").eq(spellId_))
            .getColumn("SpellID")
            .get(0),
        ),
      );
    }
    if (spell.ifNotSpell.length === 0) {
      delete spell.ifNotSpell;
    }

    const miscData = spellMisc.where(pl.col("SpellID").eq(spellId_));
    if (!miscData.isEmpty()) {
      const attr0: number = miscData.getColumn("Attributes_0").get(0);
      const attr4: number = miscData.getColumn("Attributes_4").get(0);
      const attr8: number = miscData.getColumn("Attributes_8").get(0);
      spell.isPassive = Boolean(attr0 & 0x40);
      passives.push(spellId);
      if (attr0 & 0x80 || attr4 & 0x8000 || attr8 & 0x2000) {
        continue; // "Do Not Display" flag or "Not in Spellbook" flag or "Not in Spellbook unless learned"
      }
    }

    const categories = spellCategories.where(pl.col("SpellID").eq(spellId_));
    if (!categories.isEmpty()) {
      const [category, startRecoveryCategory, chargeCategory]: number[] =
        categories
          .select("Category", "StartRecoveryCategory", "ChargeCategory")
          .row(0);

      spell.gcdCategory = startRecoveryCategory;
      if (startRecoveryCategory === 133) {
        spell.gcd = 1500;
      }
      spell.spellCategory = category ? category : chargeCategory;

      if (chargeCategory) {
        const [maxCharges, chargeRecoveryTime] = spellCategory
          .where(pl.col("ID").eq(chargeCategory))
          .select("MaxCharges", "ChargeRecoveryTime")
          .row(0);
        spell.maxCharges = maxCharges;
        spell.cooldown = chargeRecoveryTime;
      }
    }
    const cooldown = spellCooldowns.where(pl.col("SpellID").eq(spellId_));
    if (!cooldown.isEmpty()) {
      const [categoryRecoveryTime, recoveryTime, startRecoveryTime] = cooldown
        .select("CategoryRecoveryTime", "RecoveryTime", "StartRecoveryTime")
        .row(0);
      if (!spell.cooldown && categoryRecoveryTime) {
        spell.cooldown = categoryRecoveryTime;
      } else if (!spell.cooldown && recoveryTime) {
        spell.cooldown = recoveryTime;
      }
      // "StartRecovery" appears to be the internal GCD name
      if (startRecoveryTime) {
        spell.gcd = startRecoveryTime;
      }
    }
    spellData.set(spellId, spell);
  }

  const spellClassOptions = await table("SpellClassOptions", buildVersion);
  const spellEffect = await table("SpellEffect", buildVersion);
  const passiveEffects = spellEffect.where(pl.col("SpellID").isIn(passives));

  for (const spell of spellData.values()) {
    const [mask0, mask1, mask2, mask3] = spellClassOptions
      .where(pl.col("SpellID").eq(spell.id))
      .select(
        "SpellClassMask_0",
        "SpellClassMask_1",
        "SpellClassMask_2",
        "SpellClassMask_3",
      )
      .row(0);

    // look for gcd/cooldown modifiers
    passiveEffects
      .select(
        "EffectSpellClassMask_0",
        "EffectSpellClassMask_1",
        "EffectSpellClassMask_2",
        "EffectSpellClassMask_3",
      )
      .rows()
      .forEach(([effectMask0, effectMask1, effectMask2, effectMask3], ix) => {
        if (
          (effectMask0 & mask0) === 0 &&
          (effectMask1 & mask1) === 0 &&
          (effectMask2 & mask2) === 0 &&
          (effectMask3 & mask3) === 0
        ) {
          return;
        }
        const [effectAura, effectMisc0, effectBasePoints, passiveId] =
          passiveEffects
            .select(
              "EffectAura",
              "EffectMiscValue_0",
              "EffectBasePointsF",
              "SpellID",
            )
            .row(ix);

        if (!talentSpells.has(passiveId)) {
          if (spell.gcd && effectMisc0 === 21 && effectAura === 107) {
            // reduce gcd by flat amount
            spell.gcd += effectBasePoints;
          }
          if (spell.cooldown && effectMisc0 === 11 && effectAura === 107) {
            spell.cooldown += effectBasePoints;
          }
        }
        let effectList;
        if (talentSpells.has(passiveId)) {
          if (!spell.talentEffects[passiveId]) {
            spell.talentEffects[passiveId] = [];
          }
          effectList = spell.talentEffects[passiveId];
        } else {
          effectList = spell.passiveEffects;
        }
        effectList.push({
          effectAura,
          effectMisc0,
          effectBasePoints,
          spellId: passiveId,
        });
      });

    // check for the cooldown being hasted. this is also a spell effect from a passive
    if (spell.spellCategory) {
      const hastings = passiveEffects.where(
        pl
          .col("EffectMiscValue_0")
          .eq(spell.spellCategory)
          .and(pl.col("EffectAura").eq(457)),
      );
      if (!hastings.isEmpty()) {
        spell.hastedCooldown = true;
      }
    }
  }
  // extra charges + cooldown mods. use celerity as an example
  return Array.from(spellData.values()).filter((spell) => !spell.isPassive);
}

console.log(await spellList(268, RETAIL_VERSION));

import { dbc } from "./src/dbc.ts";
import classMask from "./src/hydraters/classMask.ts";
import name from "./src/hydraters/name.ts";
import passive from "./src/hydraters/passive.ts";
import classSpells from "./src/spell-lists/class-spells.ts";
import dragonflightTalentSpells from "./src/spell-lists/df-talent-spells.ts";
import specSpells from "./src/spell-lists/spec-spells.ts";
import { doHydration } from "./src/types.ts";

const RETAIL_VERSION = "11.1.0.59095";

const retail = dbc(RETAIL_VERSION);

const spellList = (
  await Promise.all([
    classSpells(retail, 10),
    specSpells(retail, 268),
    dragonflightTalentSpells(retail, 10, 268),
  ])
).flat();

const result = await doHydration(
  {
    name,
  },
  retail,
  spellList,
);

console.log(result);

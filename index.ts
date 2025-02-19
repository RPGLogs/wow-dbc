import { dbc } from "./src/dbc.ts";
import classMask from "./src/hydraters/classMask.ts";
import gcd from "./src/hydraters/gcd.ts";
import name from "./src/hydraters/name.ts";
import passive from "./src/hydraters/passive.ts";
import effects from "./src/hydraters/effects.ts";
import classSpells from "./src/spell-lists/class-spells.ts";
import dragonflightTalentSpells from "./src/spell-lists/df-talent-spells.ts";
import learnedSpells from "./src/spell-lists/learned-spells.ts";
import specSpells from "./src/spell-lists/spec-spells.ts";
import { doHydration } from "./src/types.ts";
import charges from "./src/hydraters/charges.ts";
import cooldown from "./src/hydraters/cooldown.ts";
import label from "./src/hydraters/label.ts";

const RETAIL_VERSION = "11.1.0.59095";

const retail = dbc(RETAIL_VERSION);

let spellList = (
  await Promise.all([
    classSpells(retail, 10),
    specSpells(retail, 268),
    dragonflightTalentSpells(retail, 10, 268),
  ])
).flat();

spellList = spellList.concat(await learnedSpells(retail, spellList));

const result = await doHydration(
  {
    name,
    classMask,
    passive,
    effects,
    gcd,
    charges,
    cooldown,
    label,
  },
  retail,
  spellList,
);

console.log(
  JSON.stringify(
    result.filter(
      (spell) => spell.name === "Fortifying Brew" || spell.id === 388813,
    ),
    null,
    2,
  ),
);

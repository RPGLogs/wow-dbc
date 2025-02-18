import type { InputType } from "node:zlib";
import { hydrater } from "../types.ts";

interface Output {
  classMask?: [number, number, number, number];
}

interface SpellClassOptions {
  SpellID: number;
  SpellClassMask_0: number;
  SpellClassMask_1: number;
  SpellClassMask_2: number;
  SpellClassMask_3: number;
}

export default hydrater({
  name: "classMask",
  async hydrate(dbc, input): Promise<Output> {
    const spellClassOptions =
      await dbc.getTable<SpellClassOptions>("SpellClassOptions");
    const options = spellClassOptions.find((opt) => opt.SpellID === input.id);

    if (options) {
      return {
        classMask: [
          options.SpellClassMask_0,
          options.SpellClassMask_1,
          options.SpellClassMask_2,
          options.SpellClassMask_3,
        ],
      };
    }

    return {};
  },
});

/**
 * Check if the provided filter matches the class mask for `spell`.
 *
 * The filter matches if for any field, `mask[i] & filter[i] != 0`.
 */
export function matchesClassMask(
  spell: Output,
  filter: Required<Output["classMask"]>,
): boolean {
  if (!spell.classMask) {
    return false;
  }

  for (let i = 0; i < 4; i += 1) {
    if (spell.classMask[i] & filter[i]) {
      return true;
    }
  }
  return false;
}

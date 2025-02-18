import type { Dbc } from "./dbc.ts";

export enum SpellSource {
  Class = "class",
  Spec = "spec",
  Talent = "talent",
  Item = "item",
}

export interface BaseSpell {
  id: number;
  source?: SpellSource;
  /**
   * Indicates that this spell, when known, overrides another spell with this id.
   */
  overrides?: number;
}

/**
 * Build a hydrater. No magic here. Just triggers inference of the type parameters.
 */
export function hydrater<
  Output extends Record<string, any>,
  Deps extends Record<string, Hydrater<unknown, any>>,
>(h: Record<string, any> & Hydrater<Output, Deps>): Hydrater<Output, Deps> {
  return h;
}

/**
 * Core type for hydrating fields on a spell object. Dependencies are guaranteed to be hydrated beforehand.
 */
export interface Hydrater<
  Output extends Record<string, any>,
  Deps extends Record<string, Hydrater<unknown, any>>,
> {
  name: string;
  dependencies?: Deps;
  hydrate(
    dbc: Dbc,
    input: Input<Deps>,
    spellList: Input<Deps>[],
  ): Promise<Output>;
  /**
   * The minimum build version that this hydrater can run on. For example: Dragonflight talent hydraters require build version 10.0.0 or greater.
   */
  afterBuildVersion?: string;
  /**
   * The first build version that this hydrater can *no longer* run on. For example: Classic talent hydraters cannot run on MoP data, so 5.0.0.
   */
  beforeBuildVersion?: string;
}

type Output<T> = T extends Hydrater<infer Out, any> ? Out : never;

type InputRaw<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof T]: (x: Output<T[k]>) => void;
}[keyof T] extends (x: infer I) => void
  ? BaseSpell & I
  : never;

type Input<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof InputRaw<T>]: InputRaw<T>[k];
};

export async function doHydration<H extends Record<string, Hydrater<any, any>>>(
  hydraters: H,
  dbc: Dbc,
  spellList: BaseSpell[],
): Promise<(BaseSpell & Output<H>)[]> {
  const allHydraters = Object.values(hydraters);

  const buildOrder = topoSortHydraters(allHydraters);
  let spells = spellList;
  for (const hydrater of buildOrder) {
    // TODO check build version

    // in order to prevent blasting the host with a ton of requests, we manually build the list.
    const next = [];
    for (const spell of spells) {
      next.push(await hydrater.hydrate(dbc, spell, spellList));
    }
    spells = next;
  }

  return spells as (BaseSpell & Output<H>)[];
}

function topoSortHydraters(
  hydraters: Array<Hydrater<any, any>>,
): Array<Hydrater<any, any>> {
  const dependents: Map<Hydrater<any, any>, Hydrater<any, any>[]> = new Map();
  for (const node of hydraters) {
    if (!node.dependencies) {
      continue;
    }
    for (const dep of Object.values(node.dependencies) as Array<
      Hydrater<any, any>
    >) {
      if (!dependents.has(dep)) {
        dependents.set(dep, []);
      }
      dependents.get(dep).push(node);
    }
  }

  const result = [];
  const completed = new Set();

  const currentPath = new Set();

  function visit(node: Hydrater<any, any>) {
    if (completed.has(node)) {
      return;
    }
    if (currentPath.has(node)) {
      throw new Error("unable to sort hydraters: cycle present");
    }

    if (dependents.has(node)) {
      currentPath.add(node);

      for (const dep of dependents.get(node)) {
        visit(dep);
      }

      currentPath.delete(node);
    }
    completed.add(node);
    result.unshift(node);
  }

  while (result.length < hydraters.length) {
    for (const node of hydraters) {
      if (completed.has(node)) {
        continue;
      }

      visit(node);
    }
  }

  console.log(result);
  return result;
}

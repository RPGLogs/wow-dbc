import type { Dbc } from "../../dbc.ts";
import type { AnySpell, Hydrater, Input } from "./types.ts";

const TIMERS = false;
export type FinalOutput<T extends Record<string, Hydrater<any, any>>> =
  Input<T>;

/**
 * Apply a collection of `Hydrater`s to a list of spells, producing a list of spell objects.
 * The output is not guaranteed to be the same order as the input.
 */
export async function doHydration<H extends Record<string, Hydrater<any, any>>>(
  hydraters: H,
  dbc: Dbc,
  spellList: AnySpell[],
): Promise<FinalOutput<H>[]> {
  const addedHydraters = new Set();
  const allHydraters = [];
  const remaining = Object.values(hydraters);
  while (remaining.length > 0) {
    const hydrater = remaining.shift()!;
    if (addedHydraters.has(hydrater.name)) {
      continue;
    }
    addedHydraters.add(hydrater.name);
    allHydraters.push(hydrater);
    if (hydrater.dependencies) {
      const deps = Object.values(hydrater.dependencies) as Hydrater<any, any>[];
      remaining.push(...deps);
    }
  }

  const spellmap: Map<number, AnySpell> = new Map();
  for (const spell of spellList) {
    if (spellmap.has(spell.id)) {
      console.warn(`Spell list contains duplicate spell id: ${spell.id}`);
    }
    spellmap.set(spell.id, spell);
  }

  TIMERS && console.time("table load");
  // begin by pre-caching all the tables
  const uniqueTables = new Set();
  await Promise.all(
    allHydraters
      .flatMap((hydrater) => hydrater.tables)
      .filter((ref) => {
        const key = `${ref.name}-${ref.key}`;
        if (uniqueTables.has(key)) {
          return false;
        }
        uniqueTables.add(key);
        return true;
      })
      // TODO this will make duplicate http requests for the same table if there are multiple keys for a table
      .map((ref) => dbc.loadTable(ref.name, ref.key)),
  );
  TIMERS && console.timeEnd("table load");

  const buildOrder = topoSortHydraters(allHydraters);
  for (const hydrater of buildOrder) {
    for (const spell of spellmap.values()) {
      Object.assign(spell, hydrater.hydrate(dbc, spell, spellmap));
    }
  }

  return spellList as FinalOutput<H>[];
}

/**
 * Topologically sort the hydraters such that processing them from first to last
 * causes all dependents of hydrater `H` to be run *after* `H` is run.
 *
 * @throws {Error} if the hydraters contain a dependency cycle.
 */
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
      dependents.get(dep)!.push(node);
    }
  }

  const result: Array<Hydrater<any, any>> = [];
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

      for (const dep of dependents.get(node)!) {
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

  return result;
}

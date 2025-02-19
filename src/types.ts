import type { Dbc } from "./dbc.ts";

export enum SpellType {
  Class = "class",
  Spec = "spec",
  Talent = "talent",
  Item = "item",
  /**
   * Used for triggered temporary buffs, including cooldown buffs that happen on cast and proc buffs.
   */
  TemporaryAura = "temporary-aura",
}

export interface BaseSpell {
  id: number;
  type?: SpellType;
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
  tables: TableRef[];
  hydrate(
    dbc: Dbc,
    input: Input<Deps>,
    spellList: Map<number, Input<Deps>>,
  ): Output;
  /**
   * The minimum build version that this hydrater can run on. For example: Dragonflight talent hydraters require build version 10.0.0 or greater.
   */
  afterBuildVersion?: string;
  /**
   * The first build version that this hydrater can *no longer* run on. For example: Classic talent hydraters cannot run on MoP data, so 5.0.0.
   */
  beforeBuildVersion?: string;
}

interface TableRef {
  name: string;
  key: string;
}

type Output<T> = T extends Hydrater<infer Out, any> ? Out : never;
type FinalOutput<T extends Record<string, Hydrater<any, any>>> = Input<T>;

type InputRaw<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof T]: (x: Output<T[k]>) => void;
}[keyof T] extends (x: infer I) => void
  ? BaseSpell & I
  : never;

type Input<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof InputRaw<T>]: InputRaw<T>[k];
};

const TIMERS = false;

export async function doHydration<H extends Record<string, Hydrater<any, any>>>(
  hydraters: H,
  dbc: Dbc,
  spellList: BaseSpell[],
): Promise<FinalOutput<H>[]> {
  const allHydraters = Object.values(hydraters);

  const spellmap: Map<number, BaseSpell> = new Map();
  for (const spell of spellList) {
    if (spellmap.has(spell.id)) {
      console.warn(`Spell list contains duplicate spell id: ${spell.id}`);
    }
    spellmap.set(spell.id, spell);
  }

  for (const hydrater of allHydraters) {
    if (
      !satisfiesBuildVersion(
        dbc.buildVersion,
        hydrater.afterBuildVersion,
        hydrater.beforeBuildVersion,
      )
    ) {
      throw new Error(
        `cannot perform spell hydration ${hydrater.name}: ${dbc.buildVersion} does not satisfy constraints ${hydrater.afterBuildVersion ? ">" + hydrater.afterBuildVersion : ""} ${hydrater.beforeBuildVersion ? "<" + hydrater.beforeBuildVersion : ""}`,
      );
    }
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

function satisfiesBuildVersion(
  buildVersion: string,
  afterVersion: string | undefined,
  beforeVersion: string | undefined,
): boolean {
  // TODO
  return true;
}

function parseVersion(version: string): number[] {
  return version.split(".").map(Number);
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

  return result;
}

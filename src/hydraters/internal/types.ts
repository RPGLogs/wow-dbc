import type { Dbc } from "../../dbc.ts";

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

type InputRaw<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof T]: (x: Output<T[k]>) => void;
}[keyof T] extends (x: infer I) => void
  ? BaseSpell & I
  : never;

export type Input<T extends Record<string, Hydrater<any, any>>> = {
  [k in keyof InputRaw<T>]: InputRaw<T>[k];
};

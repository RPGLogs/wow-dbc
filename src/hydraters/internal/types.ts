import type { Dbc } from "../../dbc.ts";

export enum SpellType {
  Baseline = "baseline",
  Talent = "talent",
  Learned = "learned",
  // temporary spells, typically available during a cooldown
  Temporary = "temporary",
}

interface SharedSpellProps {
  id: number;
  /**
   * Indicates that this spell, when known, overrides another spell with this id.
   */
  overrides?: number;
}

export interface BaselineSpell extends SharedSpellProps {
  type: SpellType.Baseline;
}

export interface LearnedSpell extends SharedSpellProps {
  type: SpellType.Learned;
  taughtBy: number;
}

export interface TalentSpell extends SharedSpellProps {
  type: SpellType.Talent;
  requiresTalentEntry: number[];
  // TODO
  visibleSpellId?: number;
  /**
   * Granted talents are generally not included in talent exports, including combat log data.
   */
  granted?: boolean;
}

export interface TemporarySpell extends SharedSpellProps {
  type: SpellType.Temporary;
  grantedBy: number;
}

export type AnySpell =
  | BaselineSpell
  | LearnedSpell
  | TalentSpell
  | TemporarySpell;

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
  ? I
  : never;

type InputFlat<Base, T extends Record<string, Hydrater<any, any>>> = Base & {
  [k in keyof InputRaw<T>]: InputRaw<T>[k];
};

export type Input<T extends Record<string, Hydrater<any, any>>> =
  | InputFlat<BaselineSpell, T>
  | InputFlat<TalentSpell, T>
  | InputFlat<LearnedSpell, T>
  | InputFlat<TemporarySpell, T>;

import type { Dbc } from "../../dbc.ts";

export const SpellType = {
  Baseline: "baseline" as const,
  Talent: "talent" as const,
  MistsTalent: "mists-talent" as const,
  Learned: "learned" as const,
  // temporary spells, typically available during a cooldown
  Temporary: "temporary" as const,
};

export type SpellType = (typeof SpellType)[keyof typeof SpellType];

interface SharedSpellProps {
  id: number;
  /**
   * Indicates that this spell, when known, overrides another spell with this id.
   */
  overrides?: number;
}

/**
 * A spell that is always available to the player at max level as a result of their
 * selected class/spec.
 */
export interface BaselineSpell extends SharedSpellProps {
  type: "baseline";
}

/**
 * A spell that is taught by another spell. The availability of the learned spell is the
 * availability of the spell it is `taughtBy`.
 */
export interface LearnedSpell extends SharedSpellProps {
  type: "learned";
  taughtBy: number;
}

/**
 * A spell that comes from a Dragonflight talent tree.
 */
export interface TalentSpell extends SharedSpellProps {
  type: "talent";
  requiresTalentEntry: number[];
  // TODO
  visibleSpellId?: number;
  /**
   * Granted talents are generally not included in talent exports, including combat log data.
   */
  granted?: boolean;
}

export interface MistsTalentSpell extends SharedSpellProps {
  type: "mists-talent";
  row: number;
  column: number;
}

/**
 * A spell that is temporarily available, such as a temporary override due to a buff.
 */
export interface TemporarySpell extends SharedSpellProps {
  type: "temporary";
  grantedBy: number;
}

export type AnySpell =
  | BaselineSpell
  | LearnedSpell
  | TalentSpell
  | TemporarySpell
  | MistsTalentSpell;

/**
 * Build a hydrater. This method triggers type inferrence in a way that *mostly* doesn't require
 * manual type annotations.
 */
export function hydrater<
  Output extends object,
  Deps extends Record<string, AnyHydrater>,
>(h: Record<string, unknown> & Hydrater<Output, Deps>): Hydrater<Output, Deps> {
  return h;
}

/**
 * A *hydrater* defines how to produce (hydrate) a set of `Output` fields from spell data.
 * Hydraters may have dependencies on other Hydraters, which will be run first to populate
 * *their* `Output`s. This allows the hydration of complex output types to be split out into
 * (mostly) independent objects.
 */
export interface Hydrater<
  Output extends object,
  Deps extends Record<string, AnyHydrater>,
> {
  name: string;
  /**
   * Dependencies for the hydrater. Dependencies will be run first. Circular dependencies will
   * cause a hydration error in `doHydration`.
   *
   * *Note:* dependencies are supplied as an *object* rather than a *list* in order to work
   * around some limitations of TypeScript's inference. Using a list would result in an opaque type
   * when composing hydraters.
   */
  dependencies?: Deps;
  /**
   * A list of tables to pre-load and index before calling `hydrate`. This is a performance optimization,
   * and allows `hydrate` to be non-async (which matters an annoying amount when processing thousands of entries).
   */
  tables: TableRef[];
  /**
   * Perform the hydration of `Output`. Note that you *do not* need to merge this with `input`, just output the *new fields*.
   */
  hydrate(
    dbc: Dbc,
    input: Input<Deps>,
    spellList: Map<number, Input<Deps>>,
  ): Output;
}

interface TableRef {
  name: string;
  key: string;
}

// recursive type doesn't check successfully using `unknown`. we need `any` here.
// maybe recursive typing was a mistake, but :shrug: it works
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHydrater = Hydrater<any, any>;

// `unknown` doesn't satisfy the recursive type constraint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Output<T> = T extends Hydrater<infer Out, any> ? Out : never;

type InputRaw<T extends Record<string, AnyHydrater>> = {
  [k in keyof T]: (x: Output<T[k]>) => void;
}[keyof T] extends (x: infer I) => void
  ? I
  : never;

/**
 * Inner type that "flattens" a composed type. This is helpful for type tooltips,
 * especially if you narrow the result to a single spell type.
 */
type InputFlat<Base, T extends Record<string, AnyHydrater>> = Base & {
  [k in keyof InputRaw<T>]: InputRaw<T>[k];
};

/**
 * The input of a `Hydrater`, defined by its `Deps` (aka `T`).
 */
export type Input<T extends Record<string, AnyHydrater>> =
  | InputFlat<BaselineSpell, T>
  | InputFlat<TalentSpell, T>
  | InputFlat<LearnedSpell, T>
  | InputFlat<TemporarySpell, T>
  | InputFlat<MistsTalentSpell, T>;

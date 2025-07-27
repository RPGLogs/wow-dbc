import type { Dbc } from "../dbc.ts";
import { type AnySpell } from "../hydraters/internal/types.ts";
/**
 * Get specialization-specific spells that are learned automatically. This does not include base class spells, and does not include opt-in spells from talents (even if technically you have to take them in order to spend any talent points).
 * @param dbc
 * @param specId
 */
export default function specSpells(dbc: Dbc, specId: number): Promise<AnySpell[]>;
//# sourceMappingURL=spec-spells.d.ts.map
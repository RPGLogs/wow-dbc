import type { Dbc } from "../dbc.ts";
import type { AnySpell } from "../hydraters/internal/types.ts";
export declare function isRemovedSpell(dbc: Dbc, spellId: number): boolean;
export declare function classSkillLine(dbc: Dbc, classId: number): Promise<number | undefined>;
export default function classSpells(dbc: Dbc, classId: number): Promise<AnySpell[]>;
//# sourceMappingURL=class-spells.d.ts.map
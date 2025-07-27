export const SpellType = {
    Baseline: "baseline",
    Talent: "talent",
    MistsTalent: "mists-talent",
    Learned: "learned",
    // temporary spells, typically available during a cooldown
    Temporary: "temporary",
};
/**
 * Build a hydrater. This method triggers type inferrence in a way that *mostly* doesn't require
 * manual type annotations.
 */
export function hydrater(h) {
    return h;
}

export interface PassiveOutput {
    /**
     * Whether the spell is a passive effect.
     */
    passive: boolean;
    /**
     * Whether the spell is hidden. Hidden passives are used to apply a bunch of modifiers, so they are relevant even if invisible.
     */
    hidden?: "always" | "unless-learned";
}
declare const _default: import("./internal/types.ts").Hydrater<PassiveOutput, Record<string, import("./internal/types.ts").Hydrater<Record<string, any>, any>>>;
export default _default;
//# sourceMappingURL=passive.d.ts.map
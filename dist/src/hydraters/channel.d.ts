export interface ChannelOutput {
    channel?: {
        duration: number;
        hasted: boolean;
        buffIsLogged: boolean;
        triggeredSpells?: {
            spell: number;
            period: number;
            hasted: boolean;
        }[];
    };
}
/**
 * Retrieve data about the channeling that a spell causes. Broadly, there are 3 types of channeled spells:
 *
 * - Periodic Triggers: Channeling the spell causes another spell to periodically fire (via a `SpellEffect` entry).
 * - Auras: Channeling the spell applies a visible aura to the player for the duration of the channel.
 * - Special: the hopeless ones. Spells like Penance that *look like* simple periodic triggers from in-game usage are secretly special because their spell effects are just "Server-Side Effect".
 */
declare const _default: import("./internal/types.ts").Hydrater<ChannelOutput, Record<string, import("./internal/types.ts").Hydrater<Record<string, any>, any>>>;
export default _default;
//# sourceMappingURL=channel.d.ts.map
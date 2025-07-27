/**
 * Handle for dbc table lookup.
 */
export interface Dbc {
    loadTable<T extends Record<string, any>, Key extends keyof T = keyof T>(name: string, key: Key): Promise<Table<T, Key>>;
    getTable<T extends Record<string, any>, Key extends keyof T = keyof T>(name: string, key: Key): Table<T, Key>;
    buildVersion: string;
}
/**
 * A reference to a DBC table in memory, indexed by `K`.
 */
export declare class Table<T extends Record<string, any>, K extends keyof T> {
    private readonly data;
    readonly key: K;
    constructor(data: T[], key: K);
    /**
     * Get the first row with `K = index`, if any exist.
     */
    getFirst(index: T[K]): T | undefined;
    /**
     * Get all rows where `K = index`.
     */
    getAll(index: T[K]): T[];
    /**
     * Get **all** rows. This should be a last resort!
     */
    contents(): T[];
}
/**
 * Generate a `Dbc` object with build version `buildVersion`.
 */
export declare function dbc(buildVersion: string): Dbc;
//# sourceMappingURL=dbc.d.ts.map
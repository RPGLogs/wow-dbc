import fs from "node:fs/promises";
import path from "node:path";
import * as udsv from "udsv";
const cacheDir = path.join(import.meta.dirname, ".table-cache");
function cachePath(key) {
    return path.join(cacheDir, encodeURIComponent(key) + ".csv");
}
async function loadCachedTable(key) {
    try {
        const file = await fs.open(cachePath(key), "r");
        const text = await file.readFile();
        await file.close();
        return text;
    }
    catch {
        return undefined;
    }
}
async function storeCachedTable(key, data) {
    await fs.mkdir(cacheDir, { recursive: true });
    const file = await fs.open(cachePath(key), "w");
    await file.writeFile(data);
    await file.close();
}
/**
 * Get table data in raw CSV form. This will request from wago.tools if needed and cache on disk.
 */
async function getTableData(tableName, buildVersion, filter) {
    const url = new URL(`https://wago.tools/db2/${tableName}/csv`);
    url.searchParams.append("build", buildVersion);
    if (filter) {
        for (const [key, value] of Object.entries(filter)) {
            url.searchParams.append(`filter[${key}]`, value);
        }
    }
    const cached = await loadCachedTable(url.toString());
    if (cached) {
        return cached.toString("utf8");
    }
    const res = await fetch(url);
    const body = await res.text();
    await storeCachedTable(url.toString(), body);
    return body;
}
/**
 * A reference to a DBC table in memory, indexed by `K`.
 */
export class Table {
    data;
    key;
    constructor(data, key) {
        this.key = key;
        this.data = keyByMultiple(data, key);
    }
    /**
     * Get the first row with `K = index`, if any exist.
     */
    getFirst(index) {
        return this.data.get(index)?.[0];
    }
    /**
     * Get all rows where `K = index`.
     */
    getAll(index) {
        return this.data.get(index) ?? [];
    }
    /**
     * Get **all** rows. This should be a last resort!
     */
    contents() {
        return Array.from(this.data.values()).flat();
    }
}
async function getTable(name, buildVersion) {
    const rawCsv = await getTableData(name, buildVersion);
    const schema = udsv.inferSchema(rawCsv);
    const parser = udsv.initParser(schema);
    return parser.typedObjs(rawCsv);
}
/**
 * Generate a `Dbc` object with build version `buildVersion`.
 */
export function dbc(buildVersion) {
    const cache = {};
    return {
        getTable(name, key) {
            const cacheKey = `${name}-${String(key)}`;
            if (!cache[cacheKey]) {
                throw new Error("unable to retrieve cached table " + cacheKey);
            }
            return cache[cacheKey];
        },
        async loadTable(name, key) {
            const cacheKey = `${name}-${String(key)}`;
            if (cache[cacheKey]) {
                return cache[cacheKey];
            }
            const records = await getTable(name, buildVersion);
            cache[cacheKey] = new Table(records, key);
            return cache[cacheKey];
        },
        buildVersion,
    };
}
function keyByMultiple(records, key) {
    const result = new Map();
    for (const record of records) {
        if (!result.has(record[key])) {
            result.set(record[key], []);
        }
        result.get(record[key]).push(record);
    }
    return result;
}

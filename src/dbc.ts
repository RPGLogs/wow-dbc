import fs from "node:fs/promises";
import path from "node:path";
import * as udsv from "udsv";

/**
 * Handle for dbc table lookup.
 */
export interface Dbc {
  loadTable<T extends object, Key extends keyof T = keyof T>(
    name: string,
    key: Key,
  ): Promise<Table<T, Key>>;
  getTable<T extends object, Key extends keyof T = keyof T>(
    name: string,
    key: Key,
  ): Table<T, Key>;
  buildVersion: string;
}

const cacheDir = path.join(import.meta.dirname, ".table-cache");

function cachePath(key: string): string {
  return path.join(cacheDir, encodeURIComponent(key) + ".csv");
}

async function loadCachedTable(key: string): Promise<Buffer | undefined> {
  try {
    const file = await fs.open(cachePath(key), "r");
    const text = await file.readFile();
    await file.close();
    return text;
  } catch {
    return undefined;
  }
}

async function storeCachedTable(key: string, data: string): Promise<void> {
  await fs.mkdir(cacheDir, { recursive: true });
  const file = await fs.open(cachePath(key), "w");
  await file.writeFile(data);
  await file.close();
}

/**
 * Get table data in raw CSV form. This will request from wago.tools if needed and cache on disk.
 */
async function getTableData(
  tableName: string,
  buildVersion: string,
  filter?: Record<string, string>,
): Promise<string> {
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
export class Table<T extends object, K extends keyof T> {
  private readonly data: Map<T[K], T[]>;
  public readonly key: K;

  constructor(data: T[], key: K) {
    this.key = key;
    this.data = keyByMultiple(data, key);
  }

  /**
   * Get the first row with `K = index`, if any exist.
   */
  getFirst(index: T[K]): T | undefined {
    return this.data.get(index)?.[0];
  }

  /**
   * Get all rows where `K = index`.
   */
  getAll(index: T[K]): T[] {
    return this.data.get(index) ?? [];
  }

  /**
   * Get **all** rows. This should be a last resort!
   */
  contents(): T[] {
    return Array.from(this.data.values()).flat();
  }
}

async function getTable<T extends object>(
  name: string,
  buildVersion: string,
): Promise<Array<T>> {
  const rawCsv = await getTableData(name, buildVersion);
  const schema = udsv.inferSchema(rawCsv);
  const parser = udsv.initParser(schema);
  return parser.typedObjs(rawCsv) as T[];
}

/**
 * Generate a `Dbc` object with build version `buildVersion`.
 */
export function dbc(buildVersion: string): Dbc {
  // this any doesn't leak and is useful for typing an internal cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache: Record<string, Table<any, any>> = {};
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cache[cacheKey] = new Table<any, any>(records, key as string);
      return cache[cacheKey];
    },
    buildVersion,
  };
}

function keyByMultiple<T, K extends keyof T>(
  records: T[],
  key: K,
): Map<T[K], T[]> {
  const result = new Map();
  for (const record of records) {
    if (!result.has(record[key])) {
      result.set(record[key], []);
    }
    result.get(record[key]).push(record);
  }
  return result;
}

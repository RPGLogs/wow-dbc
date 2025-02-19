import fs from "node:fs/promises";
import path from "node:path";
import * as udsv from "udsv";

/**
 * Handle for dbc table lookup.
 */
export interface Dbc {
  loadTable<T extends Record<string, any>, Key extends keyof T = keyof T>(
    name: string,
    key: Key,
  ): Promise<Table<T, Key>>;
  getTable<T extends Record<string, any>, Key extends keyof T = keyof T>(
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

export class Table<T extends Record<string, any>, K extends keyof T> {
  private readonly data: Map<T[K], T[]>;
  public readonly key: K;

  constructor(data: T[], key: K) {
    this.key = key;
    this.data = keyByMultiple(data, key);
  }

  getFirst(index: T[K]): T | undefined {
    return this.data.get(index)?.[0];
  }

  getAll(index: T[K]): T[] {
    return this.data.get(index) ?? [];
  }
}

async function getTable<T extends Record<string, any>>(
  name: string,
  buildVersion: string,
): Promise<Array<T>> {
  const rawCsv = await getTableData(name, buildVersion);
  const schema = udsv.inferSchema(rawCsv);
  const parser = udsv.initParser(schema);
  return parser.typedObjs(rawCsv);
}

export function dbc(buildVersion: string): Dbc {
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
      cache[cacheKey] = new Table(records, key as string);
      return cache[cacheKey];
    },
    buildVersion,
  };
}

/**
 * Convenience helper for looking up values.
 */
export function keyBy<T, K extends keyof T>(
  records: T[],
  key: K,
): Map<T[K], T> {
  const result = new Map();
  for (const record of records) {
    result.set(record[key], record);
  }
  return result;
}

/**
 * Same as `keyBy`, except that duplicate keys are handled. Slightly more annoying to work with otherwise.
 */
export function keyByMultiple<T, K extends keyof T>(
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

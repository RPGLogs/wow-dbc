import fs from "node:fs/promises";
import pp from "papaparse";
import path from "node:path";

/**
 * Handle for dbc table lookup.
 */
export interface Dbc {
  getTable<T extends Record<string, any>>(name: string): Promise<T[]>;
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

class ParseError extends Error {
  public readonly parseErrors: pp.ParseError[];
  constructor(name: string, errors: pp.ParseError[]) {
    super(`Unable to parse DBC file ${name} from CSV`);
    this.parseErrors = errors;
  }
}

const MEMORY_CACHE = {};

async function getTable<T extends Record<string, unknown>>(
  name: string,
  buildVersion: string,
): Promise<Array<T>> {
  const memoryCacheKey = `${name}-${buildVersion}`;
  if (MEMORY_CACHE[memoryCacheKey]) {
    return MEMORY_CACHE[memoryCacheKey];
  }
  const rawCsv = await getTableData(name, buildVersion);
  const result = pp.parse<T>(rawCsv, {
    header: true,
    dynamicTyping: true,
    download: false,
    quoteChar: '"',
    skipEmptyLines: true, // last line is empty
  });
  if (result.errors.length > 0) {
    throw new ParseError(name, result.errors);
  }
  MEMORY_CACHE[memoryCacheKey] = result.data;
  return result.data;
}

export function dbc(buildVersion: string): Dbc {
  return {
    getTable<T extends Record<string, unknown>>(name: string) {
      return getTable<T>(name, buildVersion);
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

/**
 * Simple left join helper for DBC data. Assumes that keys are unique (so not compatible with SpellEffect)
 */
export function leftJoin<
  T1 extends Record<string, any>,
  T2 extends Record<string, any>,
  K1 extends keyof T1,
  K2 extends keyof T2,
>(
  left: T1[],
  leftKey: K1,
  right: T2[],
  rightKey: K2,
): Array<{ left: T1; right: T2 | undefined }> {
  const rightLookup = keyBy(right, rightKey);
  return left.map((leftVal) => {
    const rightVal = rightLookup.get(leftVal[leftKey] as unknown as T2[K2]);
    return {
      left: leftVal,
      right: rightVal,
    };
  });
}

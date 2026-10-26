/* =====================================================
   RDSLP – KV Store backed by Supabase
   Mirrors localStorage API (getItem, setItem, removeItem)
   All methods are async because they hit the remote DB.
   ----------------------------------------------------- */
import { getClient } from "./supabase-client.js";

const TABLE = "kv_store";

/**
 * Get a value by key.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function getItem(key) {
  const client = await getClient();
  const { data, error } = await client
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .single();
  // PGRST116 = no rows
  if (error && error.code !== "PGRST116") return null;
  return data ? data.value : null;
}

/**
 * Store a value (stringified JSON is recommended).
 * @param {string} key
 * @param {string} value
 */
export async function setItem(key, value) {
  const client = await getClient();
  await client.from(TABLE).upsert({ key, value }, { onConflict: "key" });
}

/**
 * Remove a key/value pair.
 * @param {string} key
 */
export async function removeItem(key) {
  const client = await getClient();
  await client.from(TABLE).delete().eq("key", key);
}

/** Helper to get JSON objects safely */
export async function getJSON(key, fallback = null) {
  const raw = await getItem(key);
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Helper to store JSON objects */
export async function setJSON(key, obj) {
  await setItem(key, JSON.stringify(obj));
}

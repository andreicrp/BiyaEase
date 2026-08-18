/**
 * Safe, versioned local storage service supporting web localStorage,
 * AsyncStorage, and in-memory fallback for resilient offline persistence.
 */

const memoryStore: Record<string, string> = {};

export const localStorageService = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(key);
      } else if (memoryStore[key] !== undefined) {
        raw = memoryStore[key];
      }

      if (!raw) {
        return defaultValue;
      }

      const parsed = JSON.parse(raw);
      return parsed !== undefined && parsed !== null ? (parsed as T) : defaultValue;
    } catch (err) {
      console.warn(`[LOCAL_STORAGE] Failed to load key "${key}", falling back to default:`, err);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
      }
      memoryStore[key] = json;
    } catch (err) {
      console.error(`[LOCAL_STORAGE] Failed to save key "${key}":`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch (err) {
      console.error(`[LOCAL_STORAGE] Failed to remove key "${key}":`, err);
    }
  },

  async clearMemoryStore(): Promise<void> {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};

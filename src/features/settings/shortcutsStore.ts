import { useSyncExternalStore } from 'react';
import { ShortcutId, ShortcutMap, ShortcutOverrides, resolveShortcuts } from '../../domain/shortcuts';

const STORAGE_KEY = 'classivy_shortcuts_v1';
const listeners = new Set<() => void>();

const load = (): ShortcutOverrides => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShortcutOverrides) : {};
  } catch {
    return {};
  }
};

let overrides: ShortcutOverrides = load();
let snapshot: ShortcutMap = resolveShortcuts(overrides);

const commit = (next: ShortcutOverrides) => {
  overrides = next;
  snapshot = resolveShortcuts(overrides);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch { /* localStorage có thể bị chặn */ }
  listeners.forEach(listener => listener());
};

export const setShortcutKey = (id: ShortcutId, key: string) => commit({ ...overrides, [id]: key });
export const resetShortcutKeys = () => commit({});
export const getShortcutMap = () => snapshot;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

/** Bảng phím tắt hiện tại (cập nhật ngay khi đổi trong Cài đặt). */
export const useShortcutMap = (): ShortcutMap => useSyncExternalStore(subscribe, getShortcutMap, getShortcutMap);

import { describe, expect, it, vi } from 'vitest';
import { LEGACY_STORAGE_KEYS, STORAGE_KEY, STORAGE_MIGRATION_MARKER_KEY } from '../data/constants';
import { KeyValueStorage, migrateLegacyStorageKeys } from './storageMigration';

const createStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    getItem: key => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => { data.set(key, String(value)); }
  };
  return { storage, data };
};

const migrate = (storage: KeyValueStorage) =>
  migrateLegacyStorageKeys(storage, LEGACY_STORAGE_KEYS, STORAGE_MIGRATION_MARKER_KEY, 1000);

describe('migrateLegacyStorageKeys', () => {
  it('uses classivy_ keys for every legacy imperial_ key', () => {
    Object.entries(LEGACY_STORAGE_KEYS).forEach(([newKey, oldKey]) => {
      expect(newKey.startsWith('classivy_')).toBe(true);
      expect(oldKey.startsWith('imperial_')).toBe(true);
      expect(newKey.replace('classivy_', '')).toBe(oldKey.replace('imperial_', ''));
    });
  });

  it('copies old guest data to the new keys and keeps the old keys for undo', () => {
    const { storage, data } = createStorage({
      imperial_school_data_v6: '[{"id":"stu-1"}]',
      imperial_sound_pos: 'https://example.com/pos.mp3'
    });

    const result = migrate(storage);

    expect(result).toEqual({ ran: true, copiedKeys: [STORAGE_KEY, 'classivy_sound_pos'] });
    expect(data.get(STORAGE_KEY)).toBe('[{"id":"stu-1"}]');
    expect(data.get('classivy_sound_pos')).toBe('https://example.com/pos.mp3');
    expect(data.get('imperial_school_data_v6')).toBe('[{"id":"stu-1"}]');
    expect(data.get(STORAGE_MIGRATION_MARKER_KEY)).toBe('1000');
  });

  it('never overwrites a value already stored under the new key', () => {
    const { storage, data } = createStorage({
      imperial_school_data_v6: '["old"]',
      [STORAGE_KEY]: '["new"]'
    });

    expect(migrate(storage).copiedKeys).toEqual([]);
    expect(data.get(STORAGE_KEY)).toBe('["new"]');
  });

  it('runs only once', () => {
    const { storage, data } = createStorage({ imperial_skills_v6: '["a"]' });
    migrate(storage);
    data.delete('classivy_skills_v6');
    data.set('imperial_skills_v6', '["stale"]');

    expect(migrate(storage)).toEqual({ ran: false, copiedKeys: [] });
    expect(data.has('classivy_skills_v6')).toBe(false);
  });

  it('marks a fresh browser as migrated without writing data', () => {
    const { storage, data } = createStorage();
    expect(migrate(storage)).toEqual({ ran: true, copiedKeys: [] });
    expect([...data.keys()]).toEqual([STORAGE_MIGRATION_MARKER_KEY]);
  });

  it('does not throw when storage is blocked', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const blocked: KeyValueStorage = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); }
    };
    expect(migrate(blocked)).toEqual({ ran: false, copiedKeys: [] });
    errorSpy.mockRestore();
  });
});

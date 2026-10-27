import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKUP_FIELDS, pickBackupFields } from './backup';

// File sao lưu xuất trước task 2.0 có phần cấp bậc (ranksMale/ranksFemale). Hệ cấp bậc đã bỏ (D7):
// file cũ phải nhập được, phần cấp bậc bị bỏ qua, các phần khác giữ nguyên.

const legacyBackup = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../fixtures/sample-class.json'), 'utf8')
);

describe('pickBackupFields', () => {
  it('imports an old backup that still has rank lists, dropping only the ranks', () => {
    expect(legacyBackup.ranksMale).toBeDefined();
    expect(legacyBackup.ranksFemale).toBeDefined();

    const picked = pickBackupFields(legacyBackup);

    expect(picked).not.toHaveProperty('ranksMale');
    expect(picked).not.toHaveProperty('ranksFemale');
    expect(picked.students).toEqual(legacyBackup.students);
    expect(picked.skills).toEqual(legacyBackup.skills);
  });

  it('keeps every known field as-is and ignores unknown ones', () => {
    const full = Object.fromEntries(BACKUP_FIELDS.map((field, index) => [field, { marker: index }]));
    const picked = pickBackupFields({ ...full, exportedAt: 123, somethingElse: true });

    expect(picked).toEqual(full);
  });

  it('does not invent fields that are missing from the file', () => {
    expect(pickBackupFields({ students: [] })).toEqual({ students: [] });
  });

  it('rejects files that are not a JSON object', () => {
    expect(() => pickBackupFields(null)).toThrow();
    expect(() => pickBackupFields([])).toThrow();
    expect(() => pickBackupFields('text')).toThrow();
  });
});

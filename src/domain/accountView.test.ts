import { describe, expect, it } from 'vitest';
import { auditActionLabel, chunk, countByState, filterAccountRows, getAccountState, type AccountRow } from './accountView';

const row = (over: Partial<AccountRow>): AccountRow => ({
  id: 'id', clientId: 'c', name: 'Học Sinh', username: null, hasAccount: false, locked: false, mustChangePassword: false, ...over
});

const rows: AccountRow[] = [
  row({ id: '1', name: 'Nguyễn Minh Anh' }),
  row({ id: '2', name: 'Trần Bảo', hasAccount: true, username: 'bao123', mustChangePassword: true }),
  row({ id: '3', name: 'Lê Chi', hasAccount: true, username: 'chile456' }),
  row({ id: '4', name: 'Đặng Dũng', hasAccount: true, username: 'dung789', locked: true, mustChangePassword: true })
];

describe('getAccountState', () => {
  it('derives one state per row (locked wins over pending)', () => {
    expect(rows.map(getAccountState)).toEqual(['none', 'pending', 'active', 'locked']);
  });
});

describe('filterAccountRows', () => {
  it('searches names without diacritics or case', () => {
    expect(filterAccountRows(rows, 'minh anh', 'all').map(r => r.id)).toEqual(['1']);
    expect(filterAccountRows(rows, 'DANG', 'all').map(r => r.id)).toEqual(['4']);
    expect(filterAccountRows(rows, 'dũng', 'all').map(r => r.id)).toEqual(['4']);
  });

  it('searches usernames', () => {
    expect(filterAccountRows(rows, 'chile', 'all').map(r => r.id)).toEqual(['3']);
  });

  it('filters by state, alone or with a query', () => {
    expect(filterAccountRows(rows, '', 'pending').map(r => r.id)).toEqual(['2']);
    expect(filterAccountRows(rows, '', 'none').map(r => r.id)).toEqual(['1']);
    expect(filterAccountRows(rows, 'bao', 'locked')).toEqual([]);
  });

  it('returns everything for an empty query', () => {
    expect(filterAccountRows(rows, '   ', 'all')).toHaveLength(4);
  });
});

describe('countByState / chunk / auditActionLabel', () => {
  it('counts by state', () => {
    expect(countByState(rows)).toEqual({ none: 1, pending: 1, active: 1, locked: 1 });
  });

  it('splits into batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it('labels audit actions and passes unknown ones through', () => {
    expect(auditActionLabel('revoke_account')).toBe('Thu hồi tài khoản');
    expect(auditActionLabel('mystery')).toBe('mystery');
  });
});

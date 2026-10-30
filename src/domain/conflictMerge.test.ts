import { describe, expect, it } from 'vitest';
import { mergeConflicts, mergeStudent, mergeValue } from './conflictMerge';
import { Gender, Student } from '../types';

const student = (over: Partial<Student> = {}): Student => ({
  id: 's1', name: 'An', gender: Gender.MALE, className: 'SPK', points: 20, history: [],
  pets: [{ instanceId: 'p1', dexId: 25, name: 'Pikachu', types: ['Electric'], hp: 100, accessories: [], level: 3 } as never],
  ...over
});

describe('mergeStudent: học sinh mua Shop trong lúc giáo viên cộng điểm', () => {
  it('cộng dồn cả hai phía điểm và giữ lịch sử của cả hai', () => {
    const base = student();
    const local = student({ points: 23, history: [{ id: 'cô-1', amount: 3, reason: 'Phát biểu', timestamp: 200 }] });
    const server = student({ points: 15, history: [{ id: 'shop-1', amount: -5, reason: 'Mua trứng', timestamp: 100 }], eggInventory: [{ instanceId: 'e1', progress: 0, status: 'egg', assignedDexId: 1 }] });
    const merged = mergeStudent(base, local, server)!;
    expect(merged.points).toBe(18);
    expect(merged.history.map(item => item.id)).toEqual(['cô-1', 'shop-1']);
    expect(merged.eggInventory).toEqual(server.eggInventory);
  });

  it('giáo viên đổi Pokémon này, em đổi Pokémon khác: giữ cả hai', () => {
    const pet2 = { instanceId: 'p2', dexId: 1, name: 'Bulbasaur', types: ['Grass'], hp: 100, accessories: [], level: 1 } as never;
    const base = student({ pets: [...student().pets!, pet2] });
    const local = student({ pets: [{ ...student().pets![0], hp: 80 }, pet2] });
    const server = student({ pets: [...student().pets!, { ...(pet2 as object), skills: ['quick'] } as never] });
    const merged = mergeStudent(base, local, server)!;
    expect(merged.pets!.map(pet => [pet.instanceId, pet.hp, (pet as { skills?: string[] }).skills])).toEqual([
      ['p1', 80, undefined], ['p2', 100, ['quick']]
    ]);
  });

  it('em hợp nhất (xoá) Pokémon mà giáo viên không đụng: theo bản mới', () => {
    const merged = mergeStudent(student(), student({ points: 25 }), student({ pets: [] }))!;
    expect(merged.pets).toEqual([]);
    expect(merged.points).toBe(25);
  });

  it('cùng sửa đúng một giá trị: giáo viên thắng', () => {
    expect(mergeValue({ a: 1 }, { a: 2 }, { a: 3 })).toEqual({ a: 2 });
  });

  it('em bị xoá ở nơi khác thì bỏ; không có bản gốc thì giữ bản giáo viên', () => {
    expect(mergeStudent(student(), student(), undefined)).toBeNull();
    const local = student({ points: 99 });
    expect(mergeStudent(undefined, local, student())).toBe(local);
  });
});

describe('mergeConflicts', () => {
  it('chỉ gộp em bị xung đột, mốc mới lấy bản server và số phiên bản mới', () => {
    const other = student({ id: 's2', name: 'Bình', points: 7 });
    const base = { students: [student(), other], bossStatesByClass: {}, revisions: { s1: 4, s2: 9 } };
    const local = [student({ points: 21 }), { ...other, points: 8 }];
    const fresh = { students: [student({ points: 10 })], bossStatesByClass: {}, revisions: { s1: 5 } };
    const result = mergeConflicts(local, base, fresh, ['s1']);
    expect(result.students.map(s => s.points)).toEqual([11, 8]);
    expect(result.snapshot.students.map(s => s.points)).toEqual([10, 7]);
    expect(result.snapshot.revisions).toEqual({ s1: 5, s2: 9 });
  });

  it('em bị xoá trên server: bỏ khỏi máy và khỏi mốc', () => {
    const base = { students: [student()], bossStatesByClass: {}, revisions: { s1: 4 } };
    const result = mergeConflicts([student()], base, { students: [], bossStatesByClass: {} }, ['s1']);
    expect(result.students).toEqual([]);
    expect(result.snapshot.students).toEqual([]);
    expect(result.snapshot.revisions).toEqual({});
  });
});

import { describe, expect, it } from 'vitest';
import { getPokemonDisplayName, normalizePokemonPet } from './pokemonProgression';
import { PokemonPet } from '../types';

// Phase 12C: thú hợp nhất ở tài khoản học sinh do hàm DB tạo (name rỗng, cờ isFusion); app hiển thị "Hợp Thể <loài>".
const base: PokemonPet = { dexId: 25, name: '', types: [], accessories: [], skills: [] };

describe('getPokemonDisplayName', () => {
  it('giữ tên loài cho thú thường', () => {
    expect(getPokemonDisplayName(normalizePokemonPet({ ...base, name: 'Pikachu' }))).toBe('Pikachu');
  });

  it('thêm tiền tố "Hợp Thể" cho thú hợp nhất do DB tạo', () => {
    const pet = normalizePokemonPet({ ...base, isFusion: true });
    expect(pet.isFusion).toBe(true);
    expect(getPokemonDisplayName(pet)).toBe('Hợp Thể Pikachu');
  });

  it('biệt danh giáo viên/học sinh đặt vẫn được ưu tiên', () => {
    expect(getPokemonDisplayName(normalizePokemonPet({ ...base, isFusion: true, nickname: 'Tia Chớp' }))).toBe('Tia Chớp');
  });

  it('thú hợp nhất ở app giáo viên (đã có biệt danh "Hợp Thể ...") không bị lặp tiền tố', () => {
    expect(getPokemonDisplayName(normalizePokemonPet({ ...base, name: 'Hợp Thể Pikachu', nickname: 'Hợp Thể Pikachu' }))).toBe('Hợp Thể Pikachu');
  });
});

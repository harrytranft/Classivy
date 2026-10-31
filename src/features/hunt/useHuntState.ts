import { useRef, useState } from 'react';
import { PokemonPet } from '../../types';
import { WildEncounter, WildHuntSession } from '../../domain/wildHunt';

// Các buổi học đang theo dõi để hẹn giờ Pokémon hoang dã (theo lịch học của lớp). Giữ trên máy để tải lại trang
// không bốc lại giờ xuất hiện và không cho con thứ hai trong cùng buổi.
// Khoá mới (v2): phiên kiểu cũ (hẹn giờ theo lúc mở trang) bị bỏ qua.
export const WILD_HUNT_SESSIONS_KEY = 'classivy_wild_hunt_sessions_v2';

export type HuntSessions = Record<string, WildHuntSession>;

const isSession = (value: unknown): value is WildHuntSession => {
  const item = value as WildHuntSession | null;
  return !!item && typeof item === 'object'
    && typeof item.className === 'string' && typeof item.sessionKey === 'string'
    && Number.isFinite(item.windowStart) && Number.isFinite(item.windowEnd) && Number.isFinite(item.spawnAt)
    && typeof item.spawned === 'boolean';
};

const loadSessions = (): HuntSessions => {
  try {
    const raw = window.localStorage.getItem(WILD_HUNT_SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const result: HuntSessions = {};
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([className, session]) => {
        if (isSession(session)) result[className] = session;
      });
    }
    return result;
  } catch {
    return {};
  }
};

export const saveHuntSessions = (sessions: HuntSessions) => {
  try {
    window.localStorage.setItem(WILD_HUNT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Không lưu được thì chỉ mất mốc hẹn giờ khi tải lại trang.
  }
};

/** Kết quả hiển thị sau khi quay chọn người nhận Pokémon. */
export interface WildCatchResult {
  winnerId: string;
  pet: PokemonPet;
  consolationIds: string[];
  consolationPoints: number;
}

// State Săn Pokémon hoang dã: chỉ nằm trong bộ nhớ (không lưu cloud); riêng mốc hẹn giờ giữ trên máy.
export const useHuntState = () => {
  const [wildEncounter, setWildEncounter] = useState<WildEncounter | null>(null);
  const [wildCatchResult, setWildCatchResult] = useState<WildCatchResult | null>(null);
  const huntSessionsRef = useRef<HuntSessions>(loadSessions());
  return { wildEncounter, setWildEncounter, wildCatchResult, setWildCatchResult, huntSessionsRef };
};

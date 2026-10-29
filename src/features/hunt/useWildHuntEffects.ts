import { useEffect, useRef } from 'react';
import { AppScope } from '../../app/AppContext';
import { canSpawnWildPokemon, createWildEncounter, isEncounterExpired, isHuntDue, touchHuntSession } from '../../domain/wildHunt';
import { saveHuntSessions } from './useHuntState';

export const HUNT_CHECK_INTERVAL_MS = 10 * 1000;

// Hẹn giờ Pokémon hoang dã: cứ vài giây kiểm tra một lần khi giáo viên đang ở một trang của lớp.
export const useWildHuntEffects = (app: AppScope) => {
  const latest = useRef(app);
  latest.current = app;

  const check = () => {
    const a = latest.current;
    const now = Date.now();

    if (a.wildEncounter && isEncounterExpired(a.wildEncounter, now)) a.setWildEncounter(null);

    const className = a.routeClassName;
    if (!className) return;

    const settings = a.classroomSettings.wildHunt;
    const sessions = a.huntSessionsRef.current;
    const session = touchHuntSession(sessions[className], className, now, settings);
    sessions[className] = session;

    if (isHuntDue(session, now)) {
      const presentCount = a.students.filter(student => student.className === className && !student.isAbsent).length;
      // Không chen ngang khi đang Random, Cá Ngựa, Vòng quay hay bất kỳ trang con nào của lớp.
      const busy = a.showRandomModal || !!a.ludoEventPopup || !!a.routeSubPage || a.isLuckyWheelSpinning;
      const hasActiveEncounter = !!a.wildEncounter && !(isEncounterExpired(a.wildEncounter, now));
      if (canSpawnWildPokemon({ settings, presentCount, busy, hasActiveEncounter })) {
        sessions[className] = { ...session, spawned: true };
        a.setWildEncounter(createWildEncounter(settings, className, now));
      }
    }
    saveHuntSessions(sessions);
  };

  const checkRef = useRef(check);
  checkRef.current = check;

  useEffect(() => {
    const timer = window.setInterval(() => checkRef.current(), HUNT_CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Vào trang lớp là mở buổi (hoặc đánh dấu còn ở đây) ngay, không chờ vòng kiểm tra đầu tiên.
  useEffect(() => {
    checkRef.current();
  }, [app.routeClassName, app.routeSubPage]);
};

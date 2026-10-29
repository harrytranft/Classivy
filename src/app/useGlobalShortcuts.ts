import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShortcutId, shortcutIdForKey, SHORTCUT_DEFINITIONS } from '../domain/shortcuts';
import { SCREEN_PATHS } from './screenRoutes';
import { useShortcutMap } from '../features/settings/shortcutsStore';
import { useApp } from './AppContext';

const CLASS_PAGE = /^\/class\/[^/]+\/?$/;

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
};

/** Gắn phím tắt toàn app (D38). Trả về hàm mở/đóng bảng trợ giúp qua callback. */
export function useGlobalShortcuts(onToggleHelp: () => void) {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const map = useShortcutMap();
  const latest = useRef({ app, navigate, pathname: location.pathname, map, onToggleHelp });
  latest.current = { app, navigate, pathname: location.pathname, map, onToggleHelp };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (isTypingTarget(event.target)) return;
      const { app: a, navigate: go, pathname, map: keys, onToggleHelp: toggleHelp } = latest.current;
      const id = shortcutIdForKey(keys, event.key);
      if (!id) return;
      const def = SHORTCUT_DEFINITIONS.find(d => d.id === id)!;
      const dialogOpen = !!document.querySelector('[role="dialog"]');
      if (id === 'help') { event.preventDefault(); toggleHelp(); return; }
      if (dialogOpen) return;
      if (def.scope === 'class' && !CLASS_PAGE.test(pathname)) return;
      const actions: Record<Exclude<ShortcutId, 'help'>, () => void> = {
        attendance: () => a.openAttendanceCheck(),
        homework: () => a.openHomeworkCheck(),
        random: () => a.handleRandom(),
        wheel: () => a.handleOpenLuckyWheel(),
        timer: () => a.setShowTimerModal(true),
        ludo: () => a.openLudoForClass(),
        gift: () => a.openGiftPokemonModal(),
        hunt: () => a.openHuntPage(),
        group: () => a.setShowGroupModal(true),
        shop: () => a.handleOpenShop(),
        addTrainer: () => a.handleAddStudent(),
        search: () => document.getElementById('class-search')?.focus(),
        classes: () => go(SCREEN_PATHS.class),
        settings: () => go(SCREEN_PATHS.settings)
      };
      event.preventDefault();
      actions[id]();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

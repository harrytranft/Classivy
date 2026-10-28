import React, { useEffect, useRef, useState } from 'react';

const LOGO_SRC = '/brand/classivy-logo-horizontal.png';
export const SPLASH_EXIT_MS = 550;
export const SPLASH_MIN_VISIBLE_MS = 900;

interface SplashScreenProps {
  /** true khi đã tải xong: logo phóng to rồi mờ dần. */
  leaving?: boolean;
  /** Dòng chữ dưới logo (ví dụ tên lớp đang mở). */
  label?: string;
}

/** Màn hình loading toàn trang. Style `.cl-splash*` nằm trong `src/index.css`; `index.html` có bản tĩnh để không nháy trước khi JS tải xong. */
export const SplashScreen: React.FC<SplashScreenProps> = ({ leaving = false, label }) => {
  const hadBootSplash = useRef(typeof document !== 'undefined' && !!document.getElementById('boot-splash')).current;
  useEffect(() => {
    document.getElementById('boot-splash')?.remove();
  }, []);
  return (
    <div className={`cl-splash ${leaving ? 'cl-splash--leaving' : ''}`} role={leaving ? undefined : 'progressbar'} aria-hidden={leaving || undefined} aria-label="Đang tải Classivy">
      <div className="cl-splash__inner">
        <img src={LOGO_SRC} alt="Classivy" className={`cl-splash__logo ${hadBootSplash ? 'cl-splash__logo--static' : ''}`} draggable={false} />
        {label && <p className="cl-splash__label">{label}</p>}
        <div className="cl-splash__bar" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
};

type Phase = 'loading' | 'leaving' | 'gone';

/**
 * Điều khiển vòng đời trang loading: hiện khi `active`, giữ tối thiểu `minVisibleMs`,
 * rồi chạy hiệu ứng thoát và gỡ khỏi màn hình.
 */
export function useSplashPhase(active: boolean, minVisibleMs = SPLASH_MIN_VISIBLE_MS): Phase {
  const [phase, setPhase] = useState<Phase>(active ? 'loading' : 'gone');
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (active) {
      startedAt.current = Date.now();
      setPhase('loading');
      return;
    }
    let exitTimer: number | undefined;
    const wait = Math.max(0, minVisibleMs - (Date.now() - startedAt.current));
    const leaveTimer = window.setTimeout(() => {
      setPhase(prev => (prev === 'gone' ? prev : 'leaving'));
      exitTimer = window.setTimeout(() => setPhase('gone'), SPLASH_EXIT_MS);
    }, wait);
    return () => {
      window.clearTimeout(leaveTimer);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
    };
  }, [active, minVisibleMs]);

  return phase;
}

/** Bọc ứng dụng: trang loading phủ lên trên trong lúc xác thực (sau đăng nhập, mở app). */
export const AuthSplashGate: React.FC<{ loading: boolean; children: React.ReactNode }> = ({ loading, children }) => {
  const phase = useSplashPhase(loading);
  return (
    <>
      {children}
      {phase !== 'gone' && <SplashScreen leaving={phase === 'leaving'} />}
    </>
  );
};

// Nhớ lớp vừa hiện trang loading để các trang con của cùng một lớp (Vòng quay, Cá Ngựa...) không hiện lại.
let lastSplashClass: string | null = null;
export const resetClassSplash = () => { lastSplashClass = null; };

/** Trang loading ngắn (tối thiểu 0,7 giây) khi giáo viên bấm vào một lớp. */
export const ClassEntrySplash: React.FC<{ className: string }> = ({ className }) => {
  const [show] = useState(() => {
    if (lastSplashClass === className) return false;
    lastSplashClass = className;
    return true;
  });
  const [active, setActive] = useState(show);
  useEffect(() => { if (show) setActive(false); }, [show]);
  const phase = useSplashPhase(active, 700);
  return show && phase !== 'gone' ? <SplashScreen leaving={phase === 'leaving'} label={`Lớp ${className}`} /> : null;
};

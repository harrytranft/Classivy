import React, { useEffect, useRef, useState } from 'react';

export interface PointsFxState { id: number; delta: number }

let fxCounter = 0; // đếm tăng dần, không dùng Math.random để không làm lệch dãy số ngẫu nhiên có seed của smoke test
const FX_MS = 1600;
// Bỏ qua thay đổi quá lớn hoặc ngay lúc thẻ vừa hiện (tải dữ liệu, đổi lớp) để không hiện hiệu ứng nhầm.
const IGNORE_FIRST_MS = 1200;
const MAX_DELTA = 200;

/** Theo dõi điểm của một học sinh và trả về hiệu ứng khi điểm vừa đổi (từ bất kỳ nguồn nào: Ban thưởng, Random, Vòng quay...). */
export function usePointsFx(points: number): PointsFxState | null {
  const previous = useRef(points);
  const mountedAt = useRef(performance.now());
  const [fx, setFx] = useState<PointsFxState | null>(null);

  useEffect(() => {
    const delta = points - previous.current;
    previous.current = points;
    if (delta === 0 || Math.abs(delta) > MAX_DELTA || performance.now() - mountedAt.current < IGNORE_FIRST_MS) return;
    fxCounter += 1;
    const id = fxCounter;
    setFx({ id, delta });
    const timer = window.setTimeout(() => setFx(current => (current?.id === id ? null : current)), FX_MS);
    return () => window.clearTimeout(timer);
  }, [points]);

  return fx;
}

const SPARKS = [
  { dx: '-90px', dy: '-60px', e: '✦' }, { dx: '95px', dy: '-70px', e: '✧' }, { dx: '-70px', dy: '40px', e: '✦' },
  { dx: '80px', dy: '45px', e: '✧' }, { dx: '0px', dy: '-100px', e: '✦' }, { dx: '-30px', dy: '70px', e: '✧' }
];

/** Số "+N" / "−N" bay lên ngay trên thẻ, kèm tia sáng khi cộng điểm. */
export const PointsBurst: React.FC<{ fx: PointsFxState | null }> = ({ fx }) => {
  if (!fx) return null;
  const positive = fx.delta > 0;
  return (
    <div key={fx.id} className={`cl-points-burst ${positive ? 'cl-points-burst--pos' : 'cl-points-burst--neg'}`} aria-hidden>
      {positive && SPARKS.map((spark, index) => (
        <span key={index} className="cl-points-burst__spark" style={{ '--dx': spark.dx, '--dy': spark.dy, color: index % 2 ? '#e5b93c' : '#0a9a69', animationDelay: `${index * 40}ms` } as React.CSSProperties}>{spark.e}</span>
      ))}
      <span className="cl-points-burst__num">{positive ? '+' : '−'}{Math.abs(fx.delta)}</span>
    </div>
  );
};

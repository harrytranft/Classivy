import React from 'react';
import { Clock3, Pause, Play } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../app/AppContext';

export const TimerModal: React.FC = () => {
  const { customMinutes, setCustomMinutes, setShowTimerModal, setTimerRunning, showTimerModal, startTimer, timerRef, timerRunning, timerTime } = useApp();
  if (!showTimerModal) return null;
  const setMinutes = () => {
    const minutes = parseInt(customMinutes);
    if (!Number.isNaN(minutes)) startTimer(minutes * 60);
    setCustomMinutes('');
  };
  return <Modal onClose={() => setShowTimerModal(false)} title="Hẹn giờ" subtitle="Giữ nhịp hoạt động cho cả lớp" icon={<Clock3 aria-hidden />} size="sm" zIndex="z-[100]">
    <div className="space-y-5">
      <output aria-live="polite" className="block rounded-brand-lg bg-[#f4f8f1] px-5 py-6 text-center text-5xl font-extrabold tabular-nums tracking-tight text-brand-forest-deep">{Math.floor(timerTime / 60)}:{String(timerTime % 60).padStart(2, '0')}</output>
      <div className="flex gap-2 rounded-brand-md border border-[#e6e2d4] bg-white p-2"><label className="sr-only" htmlFor="timer-minutes">Số phút</label><input id="timer-minutes" type="number" min="1" placeholder="Số phút" className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none" value={customMinutes} onChange={event => setCustomMinutes(event.target.value)} /><Button size="sm" onClick={setMinutes}>Cài giờ</Button></div>
      <div className="grid grid-cols-3 gap-2">{[15, 30, 60, 180, 300, 600].map(seconds => <Button key={seconds} variant="secondary" size="sm" onClick={() => startTimer(seconds)}>{seconds < 60 ? `${seconds} giây` : `${seconds / 60} phút`}</Button>)}</div>
      <Button className="w-full" size="lg" icon={timerRunning ? <Pause aria-hidden /> : <Play aria-hidden />} onClick={() => { if (timerRunning) { setTimerRunning(false); clearInterval(timerRef.current!); } else startTimer(timerTime); }}>{timerRunning ? 'Tạm dừng' : 'Bắt đầu'}</Button>
    </div>
  </Modal>;
};

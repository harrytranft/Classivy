import React from 'react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../app/AppContext';

export const LevelUpModal: React.FC = () => {
  const {
    levelUpAnnouncement, setLevelUpAnnouncement
  } = useApp();
  return (
    levelUpAnnouncement ? <Modal onClose={() => setLevelUpAnnouncement(null)} title="Level up!" subtitle={levelUpAnnouncement.title} icon="⭐" size="md" zIndex="z-[330]" footer={<Button variant="reward" onClick={() => setLevelUpAnnouncement(null)}>Tuyệt vời</Button>}>
      <div className="space-y-2 text-center">{levelUpAnnouncement.events.map((event, index) => <p key={`${event.message}-${index}`} className="rounded-brand-md border border-brand-gold/40 bg-[#fff9df] px-4 py-3 text-sm font-bold text-brand-ink">{event.message}</p>)}</div>
    </Modal> : null
  );
};

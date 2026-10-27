import React from 'react';
import { BossContribution, BossInstance, Student } from '../types';
import { Button, Card, Modal } from './ui';

interface BossDefeatedModalProps {
  boss: BossInstance;
  topContributors: BossContribution[];
  studentsById: Record<string, Student>;
  onClose: () => void;
}

export const BossDefeatedModal: React.FC<BossDefeatedModalProps> = ({ boss, topContributors, studentsById, onClose }) => {
  return (
    <Modal onClose={onClose} title={`${boss.name} đã bị đánh bại!`} subtitle="Boss Raid hoàn thành" icon={boss.icon} size="md" zIndex="z-[280]" footer={<Button variant="reward" onClick={onClose}>Tiếp tục</Button>}>
        <Card className="bg-[#fff9df] text-left">
          <p className="mb-3 text-center text-sm font-bold text-brand-forest">Top 5 đóng góp</p>
          <div className="space-y-2">
            {topContributors.map((contribution, index) => (
              <div key={contribution.studentId} className="flex items-center justify-between rounded-brand-md bg-white px-4 py-3 text-sm font-bold text-brand-ink">
                <span>{['🥇', '🥈', '🥉'][index] || `${index + 1}.`} {studentsById[contribution.studentId]?.name || 'Trainer'}</span>
                <span>{contribution.damageDealt} DMG</span>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-5 rounded-brand-md bg-[#f4f8f1] p-4 text-sm font-bold text-brand-forest">
          Mỗi Top 5 nhận +5 Hào Quang và 1 Legendary Egg trong inventory.
        </p>

    </Modal>
  );
};

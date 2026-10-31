import React, { useState } from 'react';
import { Archive } from 'lucide-react';
import { ProfileInfoTab } from './ProfileInfoTab';
import { ProfilePetTab } from './ProfilePetTab';
import { useApp } from '../../app/AppContext';
import { Button, Modal } from '../../components/ui';

// Hồ sơ Trainer (Phase 12D, D45): hai tab giống cổng học sinh. Hồ sơ = Trainer Level, danh hiệu, huy hiệu, lịch sử, chỉnh thông tin.
// Pokémon = đồng hành/trứng, kho trứng, thám hiểm, rương tuần, Hợp nhất.
export const ProfileScreen: React.FC = () => {
  const { archiveStudent, editingStudent, goToClassPage, profileTab, setCurrentScreen, setProfileTab } = useApp();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const archive = () => {
    const { id, className } = editingStudent;
    setConfirmArchive(false);
    goToClassPage(className);
    archiveStudent(id);
  };
  const tabs = [
    { id: 'info' as const, label: 'Hồ sơ', icon: '🧑‍🎓' },
    { id: 'pet' as const, label: 'Pokémon', icon: editingStudent.pet ? '🔥' : '🥚' }
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-brand-lg border border-[#e6e2d4] bg-white p-6 shadow-[0_6px_18px_-8px_rgba(12,37,39,0.14)] animate-in slide-in-from-right-4 duration-500 sm:p-8">
      <div className="flex items-center justify-between border-b border-[#e6e2d4] pb-4">
        <div><p className="text-sm font-semibold text-brand-forest">Hành trình của Trainer</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">Hồ sơ Trainer</h2></div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Archive className="h-4 w-4" aria-hidden />}
            onClick={() => setConfirmArchive(true)}
            data-testid="archive-student"
          >
            Lưu trữ
          </Button>
          <button
            onClick={() => setCurrentScreen('class')}
            className="px-2 text-sm font-bold text-brand-forest transition-colors hover:text-brand-forest-deep"
          >
            ← Quay lại lớp
          </button>
        </div>
      </div>

      {confirmArchive && (
        <Modal
          onClose={() => setConfirmArchive(false)}
          title={`Lưu trữ ${editingStudent.name}?`}
          icon="🗄️"
          size="sm"
          footer={(
            <>
              <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Huỷ</Button>
              <Button onClick={archive} data-testid="archive-student-confirm">Lưu trữ</Button>
            </>
          )}
        >
          <p className="text-sm text-brand-ink">
            Em sẽ bị ẩn khỏi mọi trang của lớp {editingStudent.className} (danh sách, Random, Cá Ngựa, Vòng quay, điểm danh...).
            Điểm, Pokémon và lịch sử vẫn được giữ nguyên. Muốn hiện lại, vào <b>Cài đặt → Học sinh đã lưu trữ</b>.
          </p>
        </Modal>
      )}

      <div role="tablist" aria-label="Hồ sơ Trainer" className="flex shrink-0 overflow-x-auto border-b border-[#e6e2d4]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={profileTab === tab.id}
            onClick={() => setProfileTab(tab.id)}
            className={`flex min-w-max flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition-colors ${profileTab === tab.id ? 'border-brand-forest text-brand-forest' : 'border-transparent text-brand-ink/60 hover:text-brand-ink'}`}
          >
            <span aria-hidden>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {profileTab === 'pet' ? <ProfilePetTab /> : <ProfileInfoTab />}
    </div>
  );
};

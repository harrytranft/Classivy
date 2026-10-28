import React, { useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Button, ShieldScore } from '../../components/ui';
import { getStudentInitials } from '../../components/StudentAvatar';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { BadgeList, CollectionGrid, CompanionCard, HistoryList, TrainerCard } from './StudentProfileSections';

// Hồ sơ của chính học sinh (Phase 5, chỉ xem). Không có vị trí xếp hạng trong lớp (Harry chốt 2026-10-28).

interface StudentProfileScreenProps {
  profile: StudentPortalProfile;
  refreshing: boolean;
  onRefresh: () => Promise<boolean>;
  onLogout: () => void;
}

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({ profile, refreshing, onRefresh, onLogout }) => {
  const [refreshFailed, setRefreshFailed] = useState(false);

  const refresh = async () => {
    setRefreshFailed(false);
    setRefreshFailed(!(await onRefresh()));
  };

  return (
    <div className="min-h-screen bg-brand-cream font-brand text-base text-brand-ink">
      <header className="sticky top-0 z-10 border-b border-[#e6e2d4] bg-white/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2">
          <img src="/brand/classivy-logo-horizontal.png" alt="Classivy" className="h-8 w-auto" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="md" icon={<RefreshCw size={18} />} loading={refreshing} onClick={refresh} aria-label="Cập nhật hồ sơ">
              <span className="sr-only sm:not-sr-only">Cập nhật</span>
            </Button>
            <Button variant="ghost" size="md" icon={<LogOut size={18} />} onClick={onLogout}>Đăng xuất</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-5">
        {refreshFailed && (
          <div role="alert" className="rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-[13px] font-semibold text-brand-danger">
            Chưa cập nhật được. Kiểm tra mạng rồi thử lại nhé.
          </div>
        )}

        <section className="flex items-center gap-4 rounded-brand-lg bg-brand-forest p-5 text-brand-cream">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="h-16 w-16 shrink-0 rounded-brand-md object-cover ring-2 ring-brand-gold" referrerPolicy="no-referrer" />
          ) : (
            <div aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-brand-md bg-brand-cream text-xl font-extrabold text-brand-forest ring-2 ring-brand-gold">
              {getStudentInitials(profile.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-extrabold leading-tight">{profile.name}</h1>
            {profile.className && <p className="text-[13px] font-semibold text-brand-cream/80">Lớp {profile.className}</p>}
          </div>
          <div className="rounded-brand-md bg-brand-cream px-2 py-1">
            <ShieldScore points={profile.points} />
          </div>
        </section>

        <TrainerCard trainer={profile.trainer} />
        <CompanionCard companion={profile.companion} egg={profile.egg} />
        <CollectionGrid pets={profile.collection} supportPetInstanceId={profile.supportPetInstanceId} />
        <BadgeList badges={profile.badges} />
        <HistoryList items={profile.history} />

        <p className="text-center text-[13px] text-brand-ink/70">Thông tin này chỉ mình em xem được.</p>
      </main>
    </div>
  );
};

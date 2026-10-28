import React, { useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Button, ShieldScore } from '../../components/ui';
import { getStudentInitials } from '../../components/StudentAvatar';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { BadgeList, CollectionGrid, CompanionCard, HistoryList, TrainerCard } from './StudentProfileSections';
import { StudentSocialPanel } from './social/StudentSocialPanel';

// Hồ sơ của chính học sinh (Phase 5, chỉ xem). Không có vị trí xếp hạng trong lớp (Harry chốt 2026-10-28).
// Responsive (D22): điện thoại một cột; máy tính bảng (md) hai cột đều; desktop (lg) cột trái cố định
// (danh tính, Trainer Level, Pokémon) + cột phải rộng (bạn bè và quà - Phase 6, bộ sưu tập, huy hiệu, lịch sử).

interface StudentProfileScreenProps {
  profile: StudentPortalProfile;
  refreshing: boolean;
  onRefresh: () => Promise<boolean>;
  onLogout: () => void;
}

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({ profile, refreshing, onRefresh, onLogout }) => {
  const [refreshFailed, setRefreshFailed] = useState(false);
  // Tăng mỗi lần bấm "Cập nhật" để khu bạn bè + quà tải lại cùng hồ sơ.
  const [refreshSignal, setRefreshSignal] = useState(0);

  const refresh = async () => {
    setRefreshFailed(false);
    setRefreshSignal(n => n + 1);
    setRefreshFailed(!(await onRefresh()));
  };

  return (
    <div className="min-h-screen bg-brand-cream font-brand text-base text-brand-ink">
      <header className="sticky top-0 z-10 border-b border-[#e6e2d4] bg-white/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
          <img src="/brand/classivy-logo-horizontal.png" alt="Classivy" className="h-14 w-auto md:h-16" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="md" icon={<RefreshCw size={18} />} loading={refreshing} onClick={refresh} aria-label="Cập nhật hồ sơ">
              <span className="sr-only sm:not-sr-only">Cập nhật</span>
            </Button>
            <Button variant="ghost" size="md" icon={<LogOut size={18} />} onClick={onLogout}>Đăng xuất</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-5 md:max-w-3xl md:px-6 md:pt-6 lg:max-w-6xl lg:px-8 lg:pt-8">
        {refreshFailed && (
          <div role="alert" className="rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-[13px] font-semibold text-brand-danger">
            Chưa cập nhật được. Kiểm tra mạng rồi thử lại nhé.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-6">
          <div data-portal-column="identity" className="space-y-4 lg:sticky lg:top-20">
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
          </div>
          <div data-portal-column="activity" className="space-y-4">
            <StudentSocialPanel refreshSignal={refreshSignal} />
            <CollectionGrid pets={profile.collection} supportPetInstanceId={profile.supportPetInstanceId} />
            <BadgeList badges={profile.badges} />
            <HistoryList items={profile.history} />
          </div>
        </div>

        <p className="text-center text-[13px] text-brand-ink/70">Thông tin này chỉ mình em xem được.</p>
      </main>
    </div>
  );
};

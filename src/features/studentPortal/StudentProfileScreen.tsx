import React, { useState } from 'react';
import { Store, UserRound, Users, RefreshCw } from 'lucide-react';
import { Button, cx } from '../../components/ui';
import { getStudentInitials } from '../../components/StudentAvatar';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { ActivityTabs, CollectionGrid, CompanionCard, HeroCard } from './StudentProfileSections';
import { StudentSocialPanel } from './social/StudentSocialPanel';

// Cổng học sinh (Phase 10A): thanh điều hướng Hồ sơ / Cửa hàng / Bạn bè; avatar ở dưới cùng, bấm để đăng xuất.
// Học sinh không đổi được avatar (chỉ giáo viên). Responsive (D22): thanh dọc bên trái giống hệt app giáo viên (NavDock) ở mọi khổ màn hình.

type PortalTab = 'profile' | 'shop' | 'friends';

const TABS: { id: PortalTab; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }> }[] = [
  { id: 'profile', label: 'Hồ sơ', Icon: UserRound },
  { id: 'shop', label: 'Cửa hàng', Icon: Store },
  { id: 'friends', label: 'Bạn bè', Icon: Users }
];

interface StudentProfileScreenProps {
  profile: StudentPortalProfile;
  refreshing: boolean;
  onRefresh: () => Promise<boolean>;
  onLogout: () => void;
}

const AvatarLogout: React.FC<{ profile: StudentPortalProfile; onLogout: () => void }> = ({ profile, onLogout }) => (
  <button
    type="button"
    onClick={onLogout}
    aria-label="Đăng xuất"
    title="Đăng xuất"
    className="mt-3 grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-brand-cream text-sm font-extrabold text-brand-forest ring-2 ring-brand-gold/70 transition-shadow hover:ring-brand-gold"
  >
    {profile.avatar
      ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      : <span aria-hidden>{getStudentInitials(profile.name)}</span>}
  </button>
);

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({ profile, refreshing, onRefresh, onLogout }) => {
  const [tab, setTab] = useState<PortalTab>('profile');
  const [refreshFailed, setRefreshFailed] = useState(false);
  // Tăng mỗi lần bấm "Cập nhật" để khu bạn bè + quà tải lại cùng hồ sơ.
  const [refreshSignal, setRefreshSignal] = useState(0);

  const refresh = async () => {
    setRefreshFailed(false);
    setRefreshSignal(n => n + 1);
    setRefreshFailed(!(await onRefresh()));
  };

  const title = TABS.find(item => item.id === tab)!.label;

  return (
    <div className="min-h-screen bg-brand-cream font-brand text-base text-brand-ink pl-[84px]">
      {/* Thanh điều hướng trái: giống hệt tài khoản giáo viên (NavDock) */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-[84px] flex-col items-center rounded-r-[28px] bg-brand-shield py-4 text-brand-cream shadow-[4px_0_18px_-6px_rgba(1,72,47,0.45)]">
        <img src="/brand/classivy-app-icon-dark.png" alt="Classivy" className="mb-5 h-14 w-14 rounded-brand-md" />
        <nav aria-label="Điều hướng học sinh" className="flex flex-1 flex-col items-center gap-1.5">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'group/item relative grid h-12 w-12 place-items-center rounded-brand-md transition-colors',
                  active ? 'bg-brand-cream text-brand-forest-deep' : 'text-brand-cream hover:bg-white/15'
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-brand-sm bg-brand-forest-deep px-3 py-1.5 text-[13px] font-bold text-brand-cream opacity-0 shadow-lg transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100">{label}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <AvatarLogout profile={profile} onLogout={onLogout} />
        </nav>
      </div>

      <header className="sticky top-0 z-10 border-b border-[#e6e2d4] bg-white/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-brand-forest">{title}</h2>
          </div>
          <Button variant="ghost" size="md" icon={<RefreshCw size={18} />} loading={refreshing} onClick={refresh} aria-label="Cập nhật hồ sơ">
            <span className="sr-only sm:not-sr-only">Cập nhật</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-5 md:max-w-3xl md:px-6 md:pt-6 lg:max-w-6xl lg:px-8 lg:pt-8">
        {refreshFailed && (
          <div role="alert" className="rounded-brand-md border border-brand-danger/30 bg-[#fff4f2] p-3 text-[13px] font-semibold text-brand-danger">
            Chưa cập nhật được. Kiểm tra mạng rồi thử lại nhé.
          </div>
        )}

        {tab === 'profile' && (
          <div className="grid gap-4 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6">
            <div data-portal-column="identity" className="space-y-4 lg:sticky lg:top-24">
              <HeroCard name={profile.name} className={profile.className} points={profile.points} avatar={profile.avatar} trainer={profile.trainer} />
              <CompanionCard companion={profile.companion} egg={profile.egg} />
            </div>
            <div data-portal-column="activity" className="space-y-4">
              <CollectionGrid pets={profile.collection} supportPetInstanceId={profile.supportPetInstanceId} />
              <ActivityTabs badges={profile.badges} history={profile.history} />
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div data-portal-column="activity" className="mx-auto max-w-3xl space-y-4">
            <StudentSocialPanel refreshSignal={refreshSignal} />
          </div>
        )}

        {tab === 'shop' && (
          <section className="mx-auto max-w-xl rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-sm">
            <div className="text-6xl" aria-hidden>🛍️</div>
            <h1 className="mt-3 text-2xl font-extrabold text-brand-ink">Cửa hàng sắp mở</h1>
            <p className="mt-2 text-base leading-relaxed text-brand-ink/70">
              Sắp tới em sẽ mua trứng và skill bằng Hào Quang ở đây, rồi đổi Pokémon đồng hành thoải mái. Thầy cô sẽ báo khi cửa hàng mở nhé!
            </p>
          </section>
        )}

        <p className="text-center text-[13px] text-brand-ink/70">Thông tin này chỉ mình em xem được.</p>
      </main>

    </div>
  );
};

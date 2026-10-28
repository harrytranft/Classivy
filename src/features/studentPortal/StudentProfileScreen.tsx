import React, { useState } from 'react';
import { Store, UserRound, Users, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui';
import { getStudentInitials } from '../../components/StudentAvatar';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { ActivityTabs, CollectionGrid, CompanionCard, HeroCard } from './StudentProfileSections';
import { StudentSocialPanel } from './social/StudentSocialPanel';

// Cổng học sinh (Phase 10A): thanh điều hướng Hồ sơ / Cửa hàng / Bạn bè; avatar ở dưới cùng, bấm để đăng xuất.
// Học sinh không đổi được avatar (chỉ giáo viên). Responsive (D22): điện thoại có thanh tab dưới đáy,
// máy tính bảng và desktop có thanh dọc bên trái giống app giáo viên.

type PortalTab = 'profile' | 'shop' | 'friends';

const TABS: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Hồ sơ', icon: <UserRound size={24} /> },
  { id: 'shop', label: 'Cửa hàng', icon: <Store size={24} /> },
  { id: 'friends', label: 'Bạn bè', icon: <Users size={24} /> }
];

interface StudentProfileScreenProps {
  profile: StudentPortalProfile;
  refreshing: boolean;
  onRefresh: () => Promise<boolean>;
  onLogout: () => void;
}

const AvatarLogout: React.FC<{ profile: StudentPortalProfile; onLogout: () => void; className?: string }> = ({ profile, onLogout, className = '' }) => (
  <button
    type="button"
    onClick={onLogout}
    aria-label="Đăng xuất"
    title="Đăng xuất"
    className={`group relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-brand-gold bg-brand-cream text-sm font-extrabold text-brand-forest transition-transform hover:scale-105 ${className}`}
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
    <div className="min-h-screen bg-brand-cream font-brand text-base text-brand-ink md:pl-24">
      {/* Thanh dọc (máy tính bảng, desktop) */}
      <nav aria-label="Điều hướng học sinh" className="fixed inset-y-0 left-0 z-20 hidden w-24 flex-col items-center gap-2 bg-gradient-to-b from-brand-forest to-brand-forest-deep py-4 md:flex">
        <img src="/brand/classivy-shield.png" alt="Classivy" className="h-16 w-16 rounded-2xl bg-white object-contain p-1" />
        <div className="mt-4 flex flex-col gap-2">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`group relative grid h-14 w-14 place-items-center rounded-2xl transition-colors ${tab === item.id ? 'bg-brand-cream text-brand-forest' : 'text-brand-cream/80 hover:bg-white/15'}`}
            >
              {item.icon}
              <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2.5 py-1 text-[13px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">{item.label}</span>
            </button>
          ))}
        </div>
        <AvatarLogout profile={profile} onLogout={onLogout} className="mt-auto h-14 w-14" />
      </nav>

      <header className="sticky top-0 z-10 border-b border-[#e6e2d4] bg-white/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/brand/classivy-logo-horizontal.png" alt="Classivy" className="h-14 w-auto md:hidden" />
            <h2 className="hidden text-2xl font-extrabold text-brand-forest md:block">{title}</h2>
          </div>
          <Button variant="ghost" size="md" icon={<RefreshCw size={18} />} loading={refreshing} onClick={refresh} aria-label="Cập nhật hồ sơ">
            <span className="sr-only sm:not-sr-only">Cập nhật</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5 md:max-w-3xl md:px-6 md:pb-10 md:pt-6 lg:max-w-6xl lg:px-8 lg:pt-8">
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

      {/* Thanh tab dưới đáy (điện thoại) */}
      <nav aria-label="Điều hướng học sinh" className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[#e6e2d4] bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 md:hidden">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
            className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[12px] font-bold ${tab === item.id ? 'bg-brand-leaf-soft text-brand-forest' : 'text-brand-ink/70'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        <AvatarLogout profile={profile} onLogout={onLogout} className="h-11 w-11" />
      </nav>
    </div>
  );
};

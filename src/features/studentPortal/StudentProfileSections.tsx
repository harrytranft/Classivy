import React, { useState } from 'react';
import { Award, History, Sparkles } from 'lucide-react';
import { LIST_PET_SKILLS } from '../../data/pokemonData';
import { ShieldScore } from '../../components/ui';
import { getStudentInitials } from '../../components/StudentAvatar';
import { PokemonPet } from '../../types';
import { Card, Chip, EmptyState, ProgressBar } from '../../components/ui';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { PortalBadge, PortalEgg, PortalHistoryItem, PortalTrainer } from '../../domain/studentPortal';

// Các khối của hồ sơ học sinh (Phase 5). Điện thoại trước: một cột, chữ nền 16px, nhãn 13px (DESIGN.md).

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-ink">
    <span className="text-brand-emerald" aria-hidden>{icon}</span>
    {children}
  </h2>
);

export const PokemonArt: React.FC<{ pet: PokemonPet; className: string }> = ({ pet, className }) => (
  <img
    src={getPokemonArtworkUrl(pet)}
    onError={event => handlePokemonArtworkError(event, pet)}
    alt={getPokemonDisplayName(pet)}
    className={`${className} object-contain`}
    loading="lazy"
    referrerPolicy="no-referrer"
  />
);

export const TrainerCard: React.FC<{ trainer: PortalTrainer }> = ({ trainer }) => (
  <Card>
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-brand-ink/70">Trainer Level</p>
        <p className="text-3xl font-extrabold tabular-nums text-brand-forest">Cấp {trainer.level}</p>
      </div>
      <Chip tone="gold" className="text-[13px]">{trainer.title.icon} {trainer.title.name}</Chip>
    </div>
    <ProgressBar value={trainer.percent} sprout size="md" label={`Tiến độ lên cấp ${trainer.level + 1}`} className="mt-4" />
    <p className="mt-2 text-[13px] font-semibold tabular-nums text-brand-ink/70">
      {trainer.xp}/{trainer.xpNeeded} XP để lên cấp {trainer.level + 1}
    </p>
  </Card>
);

const MAX_SKILL_USES = 2;

/** Skill của Pokémon đồng hành: bấm vào một skill để đọc công dụng và số lượt còn lại (D33). */
export const SkillsPanel: React.FC<{ pet: PokemonPet }> = ({ pet }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const ids = pet.skills || [];
  if (ids.length === 0) return <p className="mt-3 text-[13px] font-semibold text-brand-ink/70">Chưa có skill nào. Skill mua ở Cửa hàng sẽ hiện ở đây.</p>;
  const open = openId ? LIST_PET_SKILLS.find(skill => skill.id === openId) : undefined;
  const left = openId ? Math.max(0, MAX_SKILL_USES - (pet.skillUses?.[openId] || 0)) : 0;
  return (
    <div className="mt-3">
      <p className="text-[13px] font-bold text-brand-ink/70">Skills (bấm để đọc công dụng)</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {ids.map(id => {
          const skill = LIST_PET_SKILLS.find(item => item.id === id);
          const active = openId === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setOpenId(active ? null : id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors ${active ? 'border-brand-emerald bg-brand-leaf-soft text-brand-forest' : 'border-[#d9d6ca] bg-white text-brand-ink hover:border-brand-emerald'}`}
              >
                <span aria-hidden>{skill?.icon || '✨'}</span>{skill?.name || 'Skill'}
              </button>
            </li>
          );
        })}
      </ul>
      {openId && (
        <div role="region" aria-label="Công dụng skill" className="mt-2 rounded-brand-md bg-brand-gold-light/60 p-3 text-[13px] text-brand-ink">
          <p className="font-extrabold">{open?.icon} {open?.name || 'Skill'}</p>
          <p className="mt-1 leading-relaxed">{open?.description || 'Thầy cô sẽ cho em biết cách dùng skill này.'}</p>
          <p className="mt-1 font-semibold tabular-nums text-brand-ink/70">Còn {left}/{MAX_SKILL_USES} lượt dùng</p>
        </div>
      )}
    </div>
  );
};

/** Danh tính + Trainer Level gộp một khối cho bớt phân mảnh. */
export const HeroCard: React.FC<{ name: string; className: string; points: number; avatar?: string; trainer: PortalTrainer }> = ({ name, className, points, avatar, trainer }) => (
  <section className="rounded-brand-lg bg-brand-forest p-5 text-brand-cream">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {avatar ? (
        <img src={avatar} alt={name} className="h-16 w-16 shrink-0 rounded-brand-md object-cover ring-2 ring-brand-gold" referrerPolicy="no-referrer" />
      ) : (
        <div aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-brand-md bg-brand-cream text-xl font-extrabold text-brand-forest ring-2 ring-brand-gold">
          {getStudentInitials(name)}
        </div>
      )}
      <div className="min-w-[8rem] flex-1">
        <h1 className="break-words text-2xl font-extrabold leading-tight">{name}</h1>
        {className && <p className="text-[13px] font-semibold text-brand-cream/80">Lớp {className}</p>}
      </div>
      <div className="rounded-brand-md bg-brand-cream px-2 py-1"><ShieldScore points={points} /></div>
    </div>
    <div className="mt-4 rounded-brand-md bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-brand-cream/80">Trainer Level</p>
          <p className="text-2xl font-extrabold tabular-nums">Cấp {trainer.level}</p>
        </div>
        <Chip tone="gold" className="text-[13px]">{trainer.title.icon} {trainer.title.name}</Chip>
      </div>
      <ProgressBar value={trainer.percent} sprout size="md" label={`Tiến độ lên cấp ${trainer.level + 1}`} className="mt-3" />
      <p className="mt-2 text-[13px] font-semibold tabular-nums text-brand-cream/80">{trainer.xp}/{trainer.xpNeeded} XP để lên cấp {trainer.level + 1}</p>
    </div>
  </section>
);

/** Huy hiệu và lịch sử Hào Quang chung một thẻ có hai tab. */
export const ActivityTabs: React.FC<{ badges: PortalBadge[]; history: PortalHistoryItem[] }> = ({ badges, history }) => {
  const [tab, setTab] = useState<'badges' | 'history'>('history');
  return (
    <section className="rounded-brand-lg border border-[#e6e2d4] bg-white p-4 shadow-sm">
      <div role="tablist" aria-label="Hoạt động của em" className="mb-3 flex gap-1 rounded-full bg-[#f1efe7] p-1">
        {([['history', 'Lịch sử Hào Quang'], ['badges', `Huy hiệu (${badges.length})`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${tab === id ? 'bg-white text-brand-forest shadow' : 'text-brand-ink/70'}`}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === 'badges' ? <BadgeList badges={badges} bare /> : <HistoryList items={history} bare />}</div>
    </section>
  );
};

export const CompanionCard: React.FC<{ companion?: PokemonPet; egg?: PortalEgg }> = ({ companion, egg }) => (
  <Card>
    <SectionTitle icon={<Sparkles size={20} />}>Pokémon đồng hành</SectionTitle>
    {companion ? (
      <div className="flex items-center gap-4 rounded-brand-md bg-[#f4f8f1] p-3">
        <PokemonArt pet={companion} className="h-24 w-24 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold text-brand-ink">{getPokemonDisplayName(companion)}</p>
          <p className="text-[13px] font-semibold text-brand-ink/70">Cấp {companion.level || 1}{companion.isShiny ? ' · ✨ Shiny' : ''}</p>
          {companion.types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {companion.types.map(type => <Chip key={type} tone="leaf">{type}</Chip>)}
            </div>
          )}
          <ProgressBar value={companion.hp ?? 100} tone={(companion.hp ?? 100) <= 20 ? 'danger' : 'leaf'} label="Máu (HP) của Pokémon" className="mt-3" />
          <p className="mt-1 text-[13px] font-semibold tabular-nums text-brand-ink/70">HP {companion.hp ?? 100}/100</p>
        </div>
      </div>
    ) : (
      <p className="rounded-brand-md bg-[#f1efe7] p-4 text-base text-brand-ink/70">Em chưa có Pokémon đồng hành. Cố gắng trong lớp để nhận trứng nhé!</p>
    )}
    {companion && <SkillsPanel pet={companion} />}
    {egg && (
      <div className="mt-4">
        <div className="flex items-center justify-between text-[13px] font-bold text-brand-ink">
          <span>🥚 {egg.label} đang ấp</span>
          <span className="tabular-nums text-brand-ink/70">{egg.progress}/{egg.required}</span>
        </div>
        <ProgressBar value={egg.percent} tone="gold" label={`Tiến độ ấp ${egg.label}`} className="mt-2" />
      </div>
    )}
  </Card>
);

export const CollectionGrid: React.FC<{ pets: PokemonPet[]; supportPetInstanceId?: string }> = ({ pets, supportPetInstanceId }) => {
  if (pets.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-extrabold text-brand-ink">Bộ sưu tập <span className="tabular-nums text-brand-ink/70">({pets.length})</span></h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {pets.map((pet, index) => (
          <li key={pet.instanceId || `${pet.dexId}-${index}`} className="flex flex-col items-center rounded-brand-md bg-[#f4f8f1] p-2 text-center">
            <PokemonArt pet={pet} className="h-16 w-16" />
            <span className="mt-1 w-full truncate text-[13px] font-bold text-brand-ink">{getPokemonDisplayName(pet)}</span>
            {pet.instanceId && pet.instanceId === supportPetInstanceId && <Chip tone="sky" className="mt-1">Hỗ trợ</Chip>}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const BadgeList: React.FC<{ badges: PortalBadge[]; bare?: boolean }> = ({ badges, bare }) => {
  const Wrap = bare ? React.Fragment : Card;
  return (
  <Wrap>
    {!bare && <SectionTitle icon={<Award size={20} />}>Huy hiệu</SectionTitle>}
    {badges.length === 0 ? (
      <p className="text-base text-brand-ink/70">Chưa có huy hiệu nào. Huy hiệu đầu tiên đang chờ em!</p>
    ) : (
      <ul className="space-y-2">
        {badges.map(badge => (
          <li key={badge.id} className="flex items-center gap-3 rounded-brand-md bg-brand-gold-light/60 p-3">
            <span className="text-2xl" aria-hidden>{badge.icon}</span>
            <div className="min-w-0">
              <p className="font-bold text-brand-ink">{badge.name}</p>
              <p className="text-[13px] text-brand-ink/70">{badge.description}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </Wrap>
  );
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const HistoryList: React.FC<{ items: PortalHistoryItem[]; bare?: boolean }> = ({ items, bare }) => {
  const Wrap = bare ? React.Fragment : Card;
  return (
  <Wrap>
    {!bare && <SectionTitle icon={<History size={20} />}>Lịch sử Hào Quang</SectionTitle>}
    {items.length === 0 ? (
      <EmptyState title="Chưa có lịch sử" description="Khi thầy cô cộng hoặc trừ Hào Quang, em sẽ thấy ở đây." className="py-8" />
    ) : (
      <ul className="divide-y divide-[#ebe8dc]">
        {items.map((item, index) => (
          <li key={`${item.occurredAt}-${index}`} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="break-words text-base text-brand-ink">{item.reason || 'Hào Quang'}</p>
              {item.occurredAt > 0 && <p className="text-[13px] tabular-nums text-brand-ink/70">{dateFormat.format(item.occurredAt)}</p>}
            </div>
            <Chip tone={item.amount < 0 ? 'danger' : item.amount > 0 ? 'leaf' : 'neutral'} className="shrink-0 text-[13px] tabular-nums">
              {item.amount > 0 ? `+${item.amount}` : item.amount < 0 ? `−${Math.abs(item.amount)}` : '0'}
            </Chip>
          </li>
        ))}
      </ul>
    )}
  </Wrap>
  );
};

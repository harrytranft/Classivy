import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { Button, Card, Chip, ProgressBar, cx } from '../../components/ui';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { SHOP_EGG_OFFERS, ShopEggKind, ShopSkill, getQuickHatchCost } from '../../domain/studentShop';
import { getPokemonDisplayName } from '../../domain/pokemonProgression';
import { PokemonArt } from './StudentProfileSections';
import { ShopAction, useStudentShop } from './useStudentShop';

// Cửa hàng học sinh (Phase 10B). Chỉ mua được khi lớp bật Cửa hàng; mọi thao tác đi qua hàm DB (atomic, ghi sổ cái).

interface StudentShopProps {
  profile: StudentPortalProfile;
  refreshSignal: number;
  onChanged: () => Promise<unknown>;
}

type Pending =
  | { type: 'egg'; kind: ShopEggKind }
  | { type: 'hatch' }
  | { type: 'skill'; skill: ShopSkill };

const PointsPill: React.FC<{ points: number }> = ({ points }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold-light px-3 py-1 text-sm font-extrabold tabular-nums text-brand-forest-deep">
    <span aria-hidden>🛡️</span>{points} Hào Quang
  </span>
);

export const StudentShop: React.FC<StudentShopProps> = ({ profile, refreshSignal, onChanged }) => {
  const { state, busy, run } = useStudentShop(refreshSignal, onChanged);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);

  const act = async (action: ShopAction, okText: string) => {
    setNotice(null);
    const result = await run(action);
    setPending(null);
    setNotice('message' in result ? { tone: 'error', text: result.message } : { tone: 'ok', text: okText });
  };

  if (state.kind === 'loading') {
    return <Card><p role="status" className="text-base text-brand-ink/70">Đang mở cửa hàng…</p></Card>;
  }
  if (state.kind === 'error') {
    return (
      <Card>
        <p role="alert" className="text-base font-semibold text-brand-danger">Chưa mở được cửa hàng. Bấm "Cập nhật" để thử lại nhé.</p>
      </Card>
    );
  }

  const { overview } = state;
  if (!overview.enabled) {
    return (
      <section className="mx-auto max-w-xl rounded-brand-lg border border-[#e6e2d4] bg-white p-8 text-center shadow-sm">
        <div className="text-6xl" aria-hidden>🛍️</div>
        <h1 className="mt-3 text-2xl font-extrabold text-brand-ink">Cửa hàng đang đóng</h1>
        <p className="mt-2 text-base leading-relaxed text-brand-ink/70">
          Thầy cô sẽ mở cửa hàng khi tới giờ. Lúc đó em mua trứng, skill bằng Hào Quang và đổi Pokémon đồng hành thoải mái nhé!
        </p>
      </section>
    );
  }

  const points = profile.points;
  const companion = profile.companion;
  const egg = profile.egg;
  const incubating = Boolean(egg);
  const hatchCost = getQuickHatchCost(egg);
  const allPets = [...(companion ? [companion] : []), ...profile.collection];

  const confirmCopy = (item: Pending): { text: string; ok: string; action: ShopAction } => {
    if (item.type === 'egg') {
      const offer = SHOP_EGG_OFFERS.find(o => o.kind === item.kind)!;
      const price = overview.eggPrices[item.kind];
      return {
        text: `Mua ${offer.label} với ${price} Hào Quang?${companion ? ' Pokémon đồng hành sẽ được cất vào bộ sưu tập cho tới khi trứng nở.' : ''}`,
        ok: `Đã mua ${offer.label}. Chúc em ấp được Pokémon xịn!`,
        action: { fn: 'student_shop_buy_egg', args: { p_kind: item.kind } }
      };
    }
    if (item.type === 'hatch') {
      return {
        text: hatchCost > 0 ? `Nở ngay quả trứng với ${hatchCost} Hào Quang? Pokémon mới sẽ thành đồng hành của em.` : 'Nở ngay quả trứng? Pokémon mới sẽ thành đồng hành của em.',
        ok: 'Trứng đã nở! Pokémon mới đã làm đồng hành của em.',
        action: { fn: 'student_shop_hatch_egg' }
      };
    }
    return {
      text: `Mua skill "${item.skill.name}" cho ${companion ? getPokemonDisplayName(companion) : 'Pokémon đồng hành'} với ${item.skill.cost} Hào Quang?`,
      ok: `Đã mua skill ${item.skill.name}.`,
      action: { fn: 'student_shop_buy_skill', args: { p_skill_id: item.skill.id } }
    };
  };

  const confirmBox = (visible: boolean) => {
    if (!pending || !visible) return null;
    const copy = confirmCopy(pending);
    return (
      <div role="alertdialog" aria-label="Xác nhận mua" className="mt-3 rounded-brand-md border border-brand-gold/60 bg-brand-gold-light/60 p-3">
        <p className="text-sm font-semibold text-brand-ink">{copy.text}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="reward" loading={busy} onClick={() => act(copy.action, copy.ok)}>Xác nhận mua</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setPending(null)}>Thôi</Button>
        </div>
      </div>
    );
  };

  const openSkill = openSkillId ? overview.skills.find(s => s.id === openSkillId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-brand-ink/70">Chọn món em thích, Hào Quang sẽ được trừ ngay.</p>
        <PointsPill points={points} />
      </div>

      {notice && (
        <div role={notice.tone === 'ok' ? 'status' : 'alert'}
          className={cx('rounded-brand-md border p-3 text-sm font-semibold',
            notice.tone === 'ok' ? 'border-[#cbe9cf] bg-[#e9f6ea] text-[#1d6a40]' : 'border-brand-danger/30 bg-[#fff4f2] text-brand-danger')}>
          {notice.text}
        </div>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-extrabold text-brand-ink">Trứng Pokémon</h2>
        {egg && (
          <div className="mb-4 rounded-brand-md bg-[#f4f8f1] p-3">
            <div className="flex items-center justify-between text-[13px] font-bold text-brand-ink">
              <span>🥚 {egg.label} đang ấp</span>
              <span className="tabular-nums text-brand-ink/70">{egg.progress}/{egg.required}</span>
            </div>
            <ProgressBar value={egg.percent} tone="gold" label={`Tiến độ ấp ${egg.label}`} className="mt-2" />
            <Button className="mt-3" size="sm" variant="reward" icon={<Zap size={16} aria-hidden />} disabled={busy || points < hatchCost}
              onClick={() => { setNotice(null); setPending({ type: 'hatch' }); }}>
              Nở nhanh{hatchCost > 0 ? ` (${hatchCost} Hào Quang)` : ''}
            </Button>
            {points < hatchCost && <p className="mt-1 text-[13px] font-semibold text-brand-ink/70">Chưa đủ Hào Quang để nở nhanh.</p>}
            {confirmBox(pending?.type === 'hatch')}
          </div>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {SHOP_EGG_OFFERS.map(offer => {
            const price = overview.eggPrices[offer.kind];
            const cannot = incubating || points < price;
            return (
              <li key={offer.kind} className="rounded-brand-md border border-[#e6e2d4] p-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden>{offer.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-brand-ink">{offer.label}</p>
                    <p className="text-[13px] font-semibold tabular-nums text-brand-ink/70">{price} Hào Quang · ấp {offer.required} lượt</p>
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-brand-ink/70">{offer.hint}</p>
                <Button className="mt-3" size="sm" disabled={busy || cannot} aria-label={`Mua ${offer.label}`}
                  onClick={() => { setNotice(null); setPending({ type: 'egg', kind: offer.kind }); }}>
                  Mua
                </Button>
                {incubating && <p className="mt-1 text-[13px] font-semibold text-brand-ink/70">Đang ấp trứng khác.</p>}
                {!incubating && points < price && <p className="mt-1 text-[13px] font-semibold text-brand-ink/70">Chưa đủ Hào Quang.</p>}
                {confirmBox(pending?.type === 'egg' && pending.kind === offer.kind)}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-extrabold text-brand-ink">Skill</h2>
        <p className="mb-3 text-[13px] text-brand-ink/70">
          {companion ? `Skill sẽ gắn cho ${getPokemonDisplayName(companion)}. Bấm vào skill để đọc công dụng.` : 'Em cần có Pokémon đồng hành mới mua skill được.'}
        </p>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {overview.skills.map(skill => {
            const owned = Boolean(companion?.skills.includes(skill.id));
            const active = openSkillId === skill.id;
            return (
              <li key={skill.id}>
                <button type="button" aria-pressed={active} onClick={() => setOpenSkillId(active ? null : skill.id)}
                  className={cx('flex h-full w-full flex-col items-start gap-1 rounded-brand-md border p-2.5 text-left transition-colors',
                    active ? 'border-brand-emerald bg-brand-leaf-soft' : 'border-[#e6e2d4] bg-white hover:border-brand-emerald')}>
                  <span className="text-2xl" aria-hidden>{skill.icon}</span>
                  <span className="text-[13px] font-extrabold leading-tight text-brand-ink">{skill.name}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-brand-ink/70">{owned ? 'Đã có' : `${skill.cost} Hào Quang`}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {openSkill && (
          <div role="region" aria-label="Công dụng skill" className="mt-3 rounded-brand-md bg-brand-gold-light/60 p-3 text-sm text-brand-ink">
            <p className="font-extrabold">{openSkill.icon} {openSkill.name}</p>
            <p className="mt-1 leading-relaxed">{openSkill.description || 'Thầy cô sẽ cho em biết cách dùng skill này.'}</p>
            {companion?.skills.includes(openSkill.id) ? (
              <p className="mt-2 inline-flex items-center gap-1 font-bold text-brand-forest"><Check size={16} aria-hidden /> Pokémon đồng hành đã có skill này</p>
            ) : (
              <Button className="mt-3" size="sm" variant="reward" disabled={busy || !companion || points < openSkill.cost}
                onClick={() => { setNotice(null); setPending({ type: 'skill', skill: openSkill }); }}>
                Mua skill ({openSkill.cost} Hào Quang)
              </Button>
            )}
            {!companion && <p className="mt-1 text-[13px] font-semibold text-brand-ink/70">Cần có Pokémon đồng hành.</p>}
            {companion && points < openSkill.cost && !companion.skills.includes(openSkill.id) && <p className="mt-1 text-[13px] font-semibold text-brand-ink/70">Chưa đủ Hào Quang.</p>}
            {confirmBox(pending?.type === 'skill' && pending.skill.id === openSkill.id)}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-extrabold text-brand-ink">Đổi Pokémon</h2>
        <p className="mb-3 text-[13px] text-brand-ink/70">
          Đổi đồng hành và Pokémon hỗ trợ miễn phí, bao nhiêu lần cũng được.{incubating ? ' Đang ấp trứng nên chưa đổi đồng hành được.' : ''}
        </p>
        {allPets.length === 0 ? (
          <p className="rounded-brand-md bg-[#f1efe7] p-4 text-base text-brand-ink/70">Em chưa có Pokémon nào. Mua một quả trứng để bắt đầu nhé!</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {allPets.map((pet, index) => {
              const isCompanion = Boolean(companion) && index === 0;
              const isSupport = Boolean(pet.instanceId) && pet.instanceId === profile.supportPetInstanceId;
              const name = getPokemonDisplayName(pet);
              return (
                <li key={pet.instanceId || `${pet.dexId}-${index}`} className="flex items-center gap-3 rounded-brand-md border border-[#e6e2d4] p-2">
                  <PokemonArt pet={pet} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-brand-ink">{name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isCompanion && <Chip tone="leaf">Đồng hành</Chip>}
                      {isSupport && <Chip tone="sky">Hỗ trợ</Chip>}
                    </div>
                    {pet.instanceId && !isCompanion && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button size="sm" variant="secondary" disabled={busy || incubating} aria-label={`Làm ${name} đồng hành`}
                          onClick={() => act({ fn: 'student_set_companion', args: { p_instance_id: pet.instanceId! } }, `${name} là Pokémon đồng hành mới.`)}>
                          Làm đồng hành
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} aria-label={isSupport ? `Bỏ hỗ trợ ${name}` : `Chọn ${name} hỗ trợ`}
                          onClick={() => act({ fn: 'student_set_support', args: { p_instance_id: isSupport ? null : pet.instanceId! } }, isSupport ? `Đã bỏ hỗ trợ ${name}.` : `${name} là Pokémon hỗ trợ.`)}>
                          {isSupport ? 'Bỏ hỗ trợ' : 'Chọn hỗ trợ'}
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { Button, Card, Chip, Modal, cx } from '../../components/ui';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { getPokemonDisplayName } from '../../domain/pokemonProgression';
import { CompanionCard, PokemonArt } from './StudentProfileSections';
import { ShopAction, useStudentShop } from './useStudentShop';

// Trang Pokémon của học sinh (Phase 12B, D41-D42): Pokémon đồng hành + skill, và bộ sưu tập kèm Đổi đồng hành/hỗ trợ.
// Hợp nhất (12C): chọn 2 Pokémon -> 1 Pokémon ngẫu nhiên mới làm đồng hành; luật nằm ở hàm DB student_fuse_pets.
// Đổi miễn phí, bao nhiêu lần cũng được, nhưng chỉ khi lớp bật Cửa hàng (luật 10B, hàm DB kiểm tra); đang ấp trứng thì chưa đổi đồng hành được.

interface StudentPokemonProps {
  profile: StudentPortalProfile;
  refreshSignal: number;
  onChanged: () => Promise<unknown>;
}

export const StudentPokemon: React.FC<StudentPokemonProps> = ({ profile, refreshSignal, onChanged }) => {
  const { state, busy, run } = useStudentShop(refreshSignal, onChanged);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [fuseIds, setFuseIds] = useState<string[]>([]);
  const [confirmFuse, setConfirmFuse] = useState(false);

  const act = async (action: ShopAction, okText: string) => {
    setNotice(null);
    const result = await run(action);
    setNotice('message' in result ? { tone: 'error', text: result.message } : { tone: 'ok', text: okText });
  };

  const { companion, egg } = profile;
  const incubating = Boolean(egg);
  const allPets = [...(companion ? [companion] : []), ...profile.collection];
  const canSwap = state.kind === 'ready' && state.overview.enabled;
  const fusable = allPets.filter(pet => pet.instanceId);
  const canFuse = canSwap && !incubating && fusable.length >= 2;
  const picked = fuseIds.map(id => fusable.find(pet => pet.instanceId === id)).filter((pet): pet is NonNullable<typeof pet> => Boolean(pet));
  const toggleFuse = (id: string) => setFuseIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 2 ? prev : [...prev, id]));
  const doFuse = async () => {
    const ids = [...fuseIds];
    setConfirmFuse(false);
    await act({ fn: 'student_fuse_pets', args: { p_instance_ids: ids } }, 'Hợp nhất thành công! Pokémon mới đã làm đồng hành của em.');
    setFuseIds([]);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6">
      <div data-portal-column="identity" className="space-y-4 lg:sticky lg:top-24">
        <CompanionCard companion={companion} egg={egg} />
      </div>
      <div data-portal-column="activity" className="space-y-4">
        {notice && (
          <div role={notice.tone === 'ok' ? 'status' : 'alert'}
            className={cx('rounded-brand-md border p-3 text-sm font-semibold',
              notice.tone === 'ok' ? 'border-[#cbe9cf] bg-[#e9f6ea] text-[#1d6a40]' : 'border-brand-danger/30 bg-[#fff4f2] text-brand-danger')}>
            {notice.text}
          </div>
        )}
        {allPets.length > 0 && (
          <Card>
            <h2 className="mb-1 text-lg font-extrabold text-brand-ink">Bộ sưu tập <span className="tabular-nums text-brand-ink/70">({allPets.length})</span></h2>
            <p className="mb-3 text-[13px] text-brand-ink/70">
              {state.kind === 'loading' && 'Đang kiểm tra xem em đổi Pokémon được chưa…'}
              {state.kind === 'error' && 'Chưa tải được thông tin đổi Pokémon. Bấm "Cập nhật" để thử lại nhé.'}
              {state.kind === 'ready' && !state.overview.enabled && 'Thầy cô sẽ mở Cửa hàng khi tới giờ. Lúc đó em đổi Pokémon đồng hành và hỗ trợ thoải mái nhé!'}
              {canSwap && `Đổi đồng hành và Pokémon hỗ trợ miễn phí, bao nhiêu lần cũng được.${incubating ? ' Đang ấp trứng nên chưa đổi đồng hành được.' : ''}`}
            </p>
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
                      {canSwap && pet.instanceId && !isCompanion && (
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
          </Card>
        )}

        {allPets.length > 0 && (
          <Card>
            <h2 className="mb-1 text-lg font-extrabold text-brand-ink">Hợp nhất Pokémon</h2>
            <p className="mb-3 text-[13px] text-brand-ink/70">
              Chọn đúng 2 Pokémon để hợp nhất thành 1 Pokémon mới (loài ngẫu nhiên) làm đồng hành. Hai Pokémon cũ sẽ biến mất, skill còn lượt dùng được giữ lại. Hợp nhất xong không quay lại được.
            </p>
            {!canSwap && state.kind === 'ready' && <p className="rounded-brand-md bg-[#f1efe7] p-3 text-[13px] text-brand-ink/70">Thầy cô sẽ mở Cửa hàng khi tới giờ, lúc đó em hợp nhất được nhé.</p>}
            {canSwap && incubating && <p className="rounded-brand-md bg-[#f1efe7] p-3 text-[13px] text-brand-ink/70">Đang ấp trứng nên chưa hợp nhất được. Chờ trứng nở nhé.</p>}
            {canSwap && !incubating && fusable.length < 2 && <p className="rounded-brand-md bg-[#f1efe7] p-3 text-[13px] text-brand-ink/70">Em cần ít nhất 2 Pokémon để hợp nhất.</p>}
            {canFuse && (
              <>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
                  {fusable.map(pet => {
                    const id = pet.instanceId!;
                    const on = fuseIds.includes(id);
                    const name = getPokemonDisplayName(pet);
                    return (
                      <li key={id}>
                        <button type="button" aria-pressed={on} aria-label={`Chọn ${name} để hợp nhất`} disabled={busy || (!on && fuseIds.length >= 2)}
                          onClick={() => toggleFuse(id)}
                          className={cx('flex w-full flex-col items-center rounded-brand-md border p-2 text-center transition-colors disabled:opacity-50',
                            on ? 'border-brand-violet bg-[#f3e9fa]' : 'border-[#e6e2d4] bg-white hover:border-brand-violet')}>
                          <PokemonArt pet={pet} className="h-14 w-14" />
                          <span className="mt-1 w-full truncate text-[13px] font-bold text-brand-ink">{name}</span>
                          <span className="text-[12px] font-semibold tabular-nums text-brand-ink/70">Cấp {pet.level ?? 1}{on ? ' · Đã chọn' : ''}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button size="md" variant="reward" disabled={busy || fuseIds.length !== 2} onClick={() => setConfirmFuse(true)}>Hợp nhất 2 Pokémon</Button>
                  <span className="text-[13px] font-semibold tabular-nums text-brand-ink/70">Đã chọn {fuseIds.length}/2</span>
                </div>
              </>
            )}
          </Card>
        )}
      {confirmFuse && picked.length === 2 && (
        <Modal size="sm" title="Hợp nhất Pokémon?" onClose={() => setConfirmFuse(false)} zIndex="z-[120]"
          footer={<><Button variant="ghost" size="md" onClick={() => setConfirmFuse(false)}>Thôi</Button><Button variant="reward" size="md" loading={busy} onClick={doFuse}>Xác nhận hợp nhất</Button></>}>
          <p className="text-base text-brand-ink">
            {getPokemonDisplayName(picked[0])} và {getPokemonDisplayName(picked[1])} sẽ biến mất. Em nhận 1 Pokémon mới (loài ngẫu nhiên) làm đồng hành, cấp bằng trung bình hai bạn. Không quay lại được.
          </p>
        </Modal>
      )}
      </div>
    </div>
  );
};

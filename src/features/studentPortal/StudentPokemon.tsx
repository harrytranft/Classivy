import React, { useState } from 'react';
import { Button, Card, Chip, cx } from '../../components/ui';
import { StudentPortalProfile } from '../../domain/studentPortal';
import { getPokemonDisplayName } from '../../domain/pokemonProgression';
import { CompanionCard, PokemonArt } from './StudentProfileSections';
import { ShopAction, useStudentShop } from './useStudentShop';

// Trang Pokémon của học sinh (Phase 12B, D41-D42): Pokémon đồng hành + skill, và bộ sưu tập kèm Đổi đồng hành/hỗ trợ.
// Đổi miễn phí, bao nhiêu lần cũng được, nhưng chỉ khi lớp bật Cửa hàng (luật 10B, hàm DB kiểm tra); đang ấp trứng thì chưa đổi đồng hành được.

interface StudentPokemonProps {
  profile: StudentPortalProfile;
  refreshSignal: number;
  onChanged: () => Promise<unknown>;
}

export const StudentPokemon: React.FC<StudentPokemonProps> = ({ profile, refreshSignal, onChanged }) => {
  const { state, busy, run } = useStudentShop(refreshSignal, onChanged);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const act = async (action: ShopAction, okText: string) => {
    setNotice(null);
    const result = await run(action);
    setNotice('message' in result ? { tone: 'error', text: result.message } : { tone: 'ok', text: okText });
  };

  const { companion, egg } = profile;
  const incubating = Boolean(egg);
  const allPets = [...(companion ? [companion] : []), ...profile.collection];
  const canSwap = state.kind === 'ready' && state.overview.enabled;

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
      </div>
    </div>
  );
};

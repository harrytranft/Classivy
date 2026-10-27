import React from 'react';
import { Check } from 'lucide-react';
import { Student } from '../types';
import { PetSkill } from '../data/pokemonData';
import { getPokemonArtworkUrl, getPokemonDisplayName, getPokemonNatureDefinition, handlePokemonArtworkError } from '../domain/pokemonProgression';
import { getBadgeDefinition, getTrainerLevelPercent, getTrainerTitleDefinition, normalizeTrainerProgress, trainerXpNeededForNextLevel } from '../domain/trainerProgression';
import { StudentAvatar } from './StudentAvatar';
import { Chip, ChipTone, ProgressBar, ShieldScore, cx } from './ui';

interface StudentCardProps {
  student: Student;
  onSelect: (student: Student) => void;
  petSkills: PetSkill[];
  isSelected?: boolean;
  /** Hiện tên lớp trên thẻ (khi xem nhiều lớp cùng lúc). Trên trang của một lớp thì thừa. */
  showClassName?: boolean;
}

const hpTone = (hp: number) => (hp > 50 ? 'leaf' : hp > 20 ? 'warning' : 'danger') as 'leaf' | 'warning' | 'danger';

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onSelect,
  petSkills,
  isSelected,
  showClassName
}) => {
  const isAbsent = student.isAbsent;

  const egg = student.egg;
  const pet = student.pet;
  const progress = student.pokemonProgress;
  const trainerProgress = normalizeTrainerProgress(student);
  const trainerTitle = getTrainerTitleDefinition(trainerProgress.titleId);
  const trainerLevelPct = getTrainerLevelPercent(trainerProgress);
  const earnedBadgeViews = (student.earnedBadges || [])
    .map(badge => getBadgeDefinition(badge.badgeId))
    .filter(Boolean)
    .slice(0, 4);
  const petHp = pet?.hp ?? 100;
  const petDanger = !!pet && petHp <= 20;
  const masteryAuraClass = pet && (pet.masteryStars || 0) >= 5
    ? 'ring-2 ring-brand-violet'
    : pet && (pet.masteryStars || 0) >= 3
      ? 'ring-2 ring-brand-gold'
      : '';
  const eggRequiredProgress = egg?.requiredProgress || 10;
  const streakBadges: { key: string; label: string; value: number; tone: ChipTone }[] = [
    { key: 'attendance', label: 'Đi học', value: progress?.attendanceStreak || 0, tone: 'sky' as ChipTone },
    { key: 'answer', label: 'Answer', value: progress?.answerStreak || 0, tone: 'leaf' as ChipTone },
    { key: 'battle', label: 'Battle', value: progress?.battleWinStreak || 0, tone: 'violet' as ChipTone },
    { key: 'homework', label: 'Homework', value: progress?.homeworkStreak || 0, tone: 'gold' as ChipTone }
  ].filter(badge => badge.value > 0);

  // Helper to determine egg appearance based on hatch progress
  const getEggStatusText = (progress: number) => {
    if (progress >= eggRequiredProgress) return { emoji: '🐣', label: 'Sẵn sàng nở!', color: 'text-brand-emerald' };
    if (progress >= Math.ceil(eggRequiredProgress * 0.7)) return { emoji: '🥚💥', label: 'Nứt sâu, rục rịch!', color: 'text-[#8f5500] animate-pulse' };
    if (progress >= Math.ceil(eggRequiredProgress * 0.4)) return { emoji: '🥚⚡', label: 'Nứt nhẹ rạn vỏ', color: 'text-[#8f5500]' };
    return { emoji: '🥚', label: 'Trứng nguyên vẹn', color: 'text-brand-ink/60' };
  };

  const eggStatus = egg ? getEggStatusText(egg.progress) : { emoji: '🥚', label: 'Đang ấp trứng', color: 'text-brand-ink/60' };

  return (
    <div
      onClick={() => onSelect(student)}
      // Vào được bằng phím Tab; Enter/Space mở như bấm chuột (chỉ khi focus đang ở chính thẻ, không phải nút con).
      role="button"
      tabIndex={0}
      aria-label={student.name}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onSelect(student);
      }}
      className={cx(
        'relative flex min-h-[340px] cursor-pointer flex-col gap-4 rounded-brand-lg border bg-white p-5 transition-[box-shadow,border-color,transform] duration-200',
        isSelected
          ? 'border-brand-forest shadow-[0_0_0_3px_#014a2d,0_10px_24px_-10px_rgba(0,38,25,0.45)]'
          : isAbsent
            ? 'border-[#e3e0d3] bg-[#f6f5ef] opacity-70 grayscale'
            : 'border-[#e6e2d4] shadow-[0_1px_2px_rgba(12,37,39,0.04),0_6px_18px_-8px_rgba(12,37,39,0.14)] hover:-translate-y-0.5 hover:border-brand-emerald/60 hover:shadow-[0_2px_4px_rgba(12,37,39,0.05),0_14px_28px_-10px_rgba(1,74,45,0.28)]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <StudentAvatar student={student} className="h-full w-full rounded-brand-md" />
          {isAbsent && (
            <div className="absolute inset-0 grid place-items-center rounded-brand-md bg-brand-ink/65 text-[12px] font-bold text-white">VẮNG</div>
          )}
          {isSelected && (
            <div className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand-forest text-brand-cream">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {pet && (
              <div className="group/poke relative shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={getPokemonArtworkUrl(pet)}
                  onError={event => handlePokemonArtworkError(event, pet)}
                  alt={getPokemonDisplayName(pet)}
                  className={cx('h-7 w-7 object-contain transition-transform group-hover/poke:scale-125', pet.isShiny && 'rounded-full bg-brand-gold-light ring-2 ring-brand-gold', petDanger ? 'animate-pulse rounded-full ring-2 ring-brand-danger' : masteryAuraClass)}
                />
                <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-56 flex-col rounded-brand-md bg-brand-forest-deep p-3 text-brand-cream shadow-[0_12px_30px_-8px_rgba(0,38,25,0.6)] group-hover/poke:flex">
                  <img
                    referrerPolicy="no-referrer"
                    src={getPokemonArtworkUrl(pet)}
                    onError={event => handlePokemonArtworkError(event, pet)}
                    alt={getPokemonDisplayName(pet)}
                    className="mx-auto my-1 h-24 w-24 object-contain"
                  />
                  <p className="text-center text-sm font-bold text-brand-gold-light">{pet.isShiny ? '✨ ' : ''}{getPokemonDisplayName(pet)}</p>
                  <p className="text-center text-[12px] text-brand-cream/70">{pet.types?.join(', ')}</p>
                  <div className="mt-2 border-t border-white/15 pt-2">
                    <p className="mb-1 text-[12px] font-bold text-brand-leaf">Kỹ năng sở hữu ({pet.skills?.length || 0}):</p>
                    {pet.skills && pet.skills.length > 0 ? (
                      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                        {pet.skills.map(skId => {
                          const sk = petSkills.find(s => s.id === skId);
                          return (
                            <div key={skId} className="flex items-center gap-1.5 rounded-brand-sm bg-white/10 p-1.5 text-[12px]">
                              <span className="text-sm">{sk?.icon || '✨'}</span>
                              <div className="min-w-0">
                                <p className="truncate font-bold">{sk?.name || skId}</p>
                                <p className="line-clamp-1 text-xs text-brand-cream/70">{sk?.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-[12px] italic text-brand-cream/60">Chưa có kỹ năng</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <h3 className="truncate text-xl font-extrabold leading-tight text-brand-ink">{student.name}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Chip tone="forest">Lv.{trainerProgress.level}</Chip>
            <Chip tone="gold">{trainerTitle.icon} {trainerTitle.name}</Chip>
            {showClassName && <Chip tone="neutral">{student.className}</Chip>}
          </div>
          {streakBadges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {streakBadges.map(badge => (
                <Chip key={badge.key} tone={badge.tone}>{badge.label} x{badge.value}</Chip>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="flex min-h-[84px] items-center gap-3 rounded-brand-md bg-[#f4f8f1] p-3">
        {pet ? (
          <>
            <div className={cx('relative grid h-11 w-11 shrink-0 place-items-center rounded-brand-sm bg-white p-0.5', petDanger ? 'animate-pulse ring-2 ring-brand-danger' : masteryAuraClass)}>
              <img
                referrerPolicy="no-referrer"
                src={getPokemonArtworkUrl(pet)}
                onError={event => handlePokemonArtworkError(event, pet)}
                className="h-full w-full object-contain"
                alt={getPokemonDisplayName(pet)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <p className="truncate text-[13px] font-bold text-brand-forest">{pet.isShiny ? '✨ ' : ''}{getPokemonDisplayName(pet)} · Lv.{pet.level || 1}</p>
                <span className={cx('shrink-0 text-[12px] font-bold tabular-nums', petDanger ? 'text-brand-danger' : 'text-[#1d6a40]')}>
                  HP {petHp}/100
                </span>
              </div>
              <ProgressBar value={petHp} tone={hpTone(petHp)} label={`HP của ${getPokemonDisplayName(pet)}`} className="mt-1.5" />
              <p className="mt-1 truncate text-[12px] text-brand-ink/65">
                {getPokemonNatureDefinition(pet.natureId).icon} {getPokemonNatureDefinition(pet.natureId).name} Nature · {pet.skills.length > 0 ? `${pet.skills.length} tuyệt chiêu` : 'Chưa có kỹ năng bổ trợ'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={cx('text-2xl', egg && egg.progress >= Math.ceil(eggRequiredProgress * 0.7) && 'animate-bounce')} aria-hidden>
              {eggStatus.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate font-bold text-brand-ink/80">Ấp Trứng Pokémon</span>
                <span className={cx('font-bold tabular-nums', eggStatus.color)}>{egg ? egg.progress : 0}/{eggRequiredProgress}đ</span>
              </div>
              <ProgressBar value={((egg ? egg.progress : 0) / eggRequiredProgress) * 100} tone="gold" label="Tiến độ ấp trứng" className="mt-1.5" />
              <p className="mt-1 truncate text-[12px] italic text-brand-ink/65">{eggStatus.label}</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto flex items-end gap-4 border-t border-[#efece2] pt-4">
        <div className="min-w-0 flex-1">
          <ProgressBar value={trainerLevelPct} tone="leaf" sprout size="md" label="Trainer XP" />
          <p className="mt-1.5 text-[12px] font-bold tabular-nums text-brand-ink/65">
            Trainer XP {trainerProgress.xp}/{trainerXpNeededForNextLevel(trainerProgress.level)}
          </p>
          {earnedBadgeViews.length > 0 && (
            <div className="mt-1 flex gap-1">
              {earnedBadgeViews.map(badge => (
                <span key={badge!.id} className="text-sm" title={badge!.name}>{badge!.icon}</span>
              ))}
            </div>
          )}
        </div>
        <ShieldScore points={student.points} />
      </div>
    </div>
  );
};

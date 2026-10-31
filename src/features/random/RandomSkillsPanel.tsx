import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { Student } from '../../types';
import { SkillHelpTip } from './SkillHelpTip';
import {
  LOOKUP_SECONDS, MAX_SKILL_USES, RANDOM_SKILLS, SKILL_IDS, consumeSkillUse, getRandomSkillsFor, getSkillUsesLeft
} from '../../domain/skills';

// Phase 11: sau khi Random gọi trúng một em, hiện các skill của em (nhóm B) với nút Dùng / Không.
// Skill tự động (Vòng Quay Tự Tin, Nhân Đôi, Lá Chắn, Kim Bài, Hộ Tống, Cướp Quyền, Đồng Tâm) chỉ hiện dạng nhãn.
// 10 skill còn lại giữ cách cũ: bấm "Sử Dụng" thủ công.
// Rê chuột vào tên skill (hoặc bấm ⓘ) để xem cách dùng, đọc cho học sinh nghe trước khi em chọn Dùng/Không.

const AUTO_SKILL_IDS: string[] = [SKILL_IDS.lucky, SKILL_IDS.double, SKILL_IDS.guard, SKILL_IDS.survival, SKILL_IDS.rescue, SKILL_IDS.rapid, SKILL_IDS.soulLink];

export const RandomSkillsPanel: React.FC<{ student: Student }> = ({ student }) => {
  const { handleRandom, handleUsePetSkill, petSkills, setRandomStudent, setStudents, startTimer, students, timerRunning, timerTime } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [pickingHelper, setPickingHelper] = useState(false);

  const skillIds = student.pet?.skills || [];
  if (skillIds.length === 0) return null;
  const nameOf = (id: string) => petSkills.find(skill => skill.id === id);
  const askIds = getRandomSkillsFor(student).filter(id => !dismissed.includes(id));
  const autoIds = skillIds.filter(id => AUTO_SKILL_IDS.includes(id));
  const manualIds = skillIds.filter(id => !AUTO_SKILL_IDS.includes(id) && !RANDOM_SKILLS[id]);
  const classmates = students.filter(item => item.className === student.className && item.id !== student.id);

  const consume = (skillId: string, detail: string): Student => {
    const info = nameOf(skillId);
    const next = consumeSkillUse(student, skillId, info?.name || 'Skill', detail);
    setStudents(prev => prev.map(item => (item.id === next.id ? next : item)));
    setRandomStudent(next);
    return next;
  };

  const use = (skillId: string) => {
    const effect = RANDOM_SKILLS[skillId].effect;
    if (effect === 'pick-helper') { setPickingHelper(true); return; }
    // Đã dùng cho lần gọi này: ẩn hộp hỏi (lượt còn lại vẫn để dành cho lần Random sau).
    setDismissed(prev => [...prev, skillId]);
    if (effect === 'reroll') {
      consume(skillId, 'trao quyền trả lời cho bạn khác');
      handleRandom('solo', { excludeStudentId: student.id });
      return;
    }
    if (effect === 'timer') {
      consume(skillId, `tra cứu ${LOOKUP_SECONDS} giây`);
      startTimer(LOOKUP_SECONDS);
      setBanners(prev => [...prev, '📖 Trợ Thủ Tra Cứu: em được mở vở tra cứu, đồng hồ đang chạy.']);
      return;
    }
    if (effect === 'easier-question') {
      consume(skillId, 'đổi sang câu hỏi dễ hơn');
      setBanners(prev => [...prev, '🔄 Đổi Đề Thần Tốc: thầy/cô đổi sang câu hỏi dễ hơn cho em.']);
      return;
    }
    consume(skillId, 'nhận một gợi ý từ thầy/cô');
    setBanners(prev => [...prev, '👁️ Mắt Thần Trí Tuệ: thầy/cô cho em một gợi ý trước khi chốt đáp án.']);
  };

  const chooseHelper = (helper: Student) => {
    consume(SKILL_IDS.decree, `mời ${helper.name} cùng thảo luận`);
    setPickingHelper(false);
    setDismissed(prev => [...prev, SKILL_IDS.decree]);
    setBanners(prev => [...prev, `📜 Đồng Đội Hỗ Trợ: ${helper.name} được mời cùng thảo luận để hỗ trợ ${student.name}.`]);
  };

  return (
    <div className="mb-6 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-4 text-left" data-testid="random-skills">
      <p className="mb-2 text-xs font-black text-indigo-900">⚡ Skill của {student.name} (tối đa {MAX_SKILL_USES} lượt, hết lượt tự mất)</p>

      {banners.length > 0 && (
        <ul className="mb-3 space-y-1.5" aria-label="Skill vừa dùng">
          {banners.map(text => (
            <li key={text} className="rounded-xl border border-brand-gold/60 bg-brand-gold-light/70 px-3 py-2 text-sm font-bold text-brand-forest-deep">{text}</li>
          ))}
          {timerRunning && <li className="text-sm font-extrabold tabular-nums text-brand-forest" role="timer">⏱ {Math.floor(timerTime / 60)}:{String(timerTime % 60).padStart(2, '0')}</li>}
        </ul>
      )}

      {askIds.length > 0 && (
        <div className="space-y-2" role="group" aria-label="Hỏi dùng skill">
          {askIds.map(id => (
            <div key={id} className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-200 bg-white p-2.5">
              <SkillHelpTip name={nameOf(id)?.name || RANDOM_SKILLS[id].label} icon={nameOf(id)?.icon} description={nameOf(id)?.description}>
                <span className="text-xl" aria-hidden>{nameOf(id)?.icon || '✨'}</span>
                <div className="min-w-0 cursor-help">
                  <p className="truncate text-xs font-bold text-brand-ink">{RANDOM_SKILLS[id].label}</p>
                  <span className="text-xs font-semibold text-indigo-600">Còn {getSkillUsesLeft(student.pet, id)}/{MAX_SKILL_USES} lượt</span>
                </div>
              </SkillHelpTip>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="secondary" aria-label={`Không dùng ${nameOf(id)?.name || id}`} onClick={() => setDismissed(prev => [...prev, id])}>Không</Button>
                <Button size="sm" variant="reward" aria-label={`Dùng ${nameOf(id)?.name || id}`} onClick={() => use(id)}>Dùng</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pickingHelper && (
        <div role="dialog" aria-label="Chọn bạn hỗ trợ" className="mt-3 rounded-2xl border border-indigo-200 bg-white p-3">
          <p className="mb-2 text-xs font-black text-indigo-900">Chọn một bạn trong lớp để mời cùng thảo luận:</p>
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {classmates.map(item => (
              <Button key={item.id} size="sm" variant="secondary" onClick={() => chooseHelper(item)}>{item.name}</Button>
            ))}
            {classmates.length === 0 && <p className="text-xs text-brand-ink/70">Lớp chưa có bạn nào khác.</p>}
          </div>
          <Button className="mt-2" size="sm" variant="ghost" onClick={() => setPickingHelper(false)}>Thôi</Button>
        </div>
      )}

      {autoIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-indigo-900/80">
          <span>Skill tự động:</span>
          {autoIds.map(id => (
            <SkillHelpTip key={id} name={nameOf(id)?.name || id} icon={nameOf(id)?.icon} description={nameOf(id)?.description}>
              <span className="cursor-help">{nameOf(id)?.icon || ''} {nameOf(id)?.name || id} ({getSkillUsesLeft(student.pet, id)}/{MAX_SKILL_USES})</span>
            </SkillHelpTip>
          ))}
        </div>
      )}

      {manualIds.length > 0 && (
        <div className="mt-3 space-y-2">
          {manualIds.map(id => {
            const info = nameOf(id);
            if (!info) return null;
            const left = getSkillUsesLeft(student.pet, id);
            return (
              <div key={id} className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-200 bg-white p-2.5">
                <SkillHelpTip name={info.name} icon={info.icon} description={info.description}>
                  <span className="text-xl" aria-hidden>{info.icon}</span>
                  <div className="min-w-0 cursor-help">
                    <p className="truncate text-xs font-bold text-brand-ink">{info.name}</p>
                    <span className="text-xs font-semibold text-indigo-600">Còn {left}/{MAX_SKILL_USES} lượt</span>
                  </div>
                </SkillHelpTip>
                <Button size="sm" variant="reward" disabled={left <= 0} onClick={() => { handleUsePetSkill(student.id, id, info.name); }}>Sử Dụng</Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

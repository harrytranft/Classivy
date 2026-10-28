import React from 'react';
import { Modal, Button } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { describePointsSkill } from '../../domain/skills';

// Phase 11: khi em có Nhân Đôi / Lá Chắn / Kim Bài phù hợp với lần cộng/trừ điểm, giáo viên bấm Dùng hoặc Không thay em (D36).
export const SkillPromptModal: React.FC = () => {
  const { pendingPoints, answerPointsSkill, cancelPointsRequest } = useApp();
  if (!pendingPoints) return null;
  const prompt = pendingPoints.prompts[pendingPoints.index];
  const info = describePointsSkill(prompt, pendingPoints.amount);
  return (
    <Modal
      onClose={cancelPointsRequest}
      title={`Skill: ${info.title}`}
      subtitle={`Câu ${pendingPoints.index + 1}/${pendingPoints.prompts.length}`}
      size="sm"
      zIndex="z-[260]"
      closeLabel="Hủy việc cộng/trừ điểm"
      closeOnBackdrop={false}
      footer={(
        <div className="flex w-full justify-end gap-2">
          <Button variant="secondary" onClick={() => answerPointsSkill(false)}>Không</Button>
          <Button variant="reward" onClick={() => answerPointsSkill(true)}>Dùng skill</Button>
        </div>
      )}
    >
      <p className="text-base leading-relaxed text-brand-ink">{info.question}</p>
      <p className="mt-2 text-[13px] text-brand-ink/70">Chọn "Không" để giữ nguyên lượt skill của em. Skill chỉ có 2 lượt, dùng hết sẽ mất.</p>
    </Modal>
  );
};

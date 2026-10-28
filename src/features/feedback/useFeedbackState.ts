import React, { useState } from 'react';
import { GameEventSource } from '../../domain/gameEvents';
import { PointsSkillKind, PointsSkillPrompt } from '../../domain/skills';

/** Yêu cầu cộng/trừ điểm đang chờ giáo viên trả lời các câu hỏi "Dùng skill?" (Phase 11). */
export interface PendingPointsRequest {
  ids: string[];
  amount: number;
  reason: string;
  source: GameEventSource;
  prompts: PointsSkillPrompt[];
  index: number;
  accepted: Record<string, PointsSkillKind[]>;
}

// State bảng cộng/trừ điểm (Ban thưởng / Phạt).
export const useFeedbackState = () => {
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [feedbackSource, setFeedbackSource] = useState<GameEventSource>('manual');
  const [manualPoints, setManualPoints] = useState<string>('');
  const [pendingPoints, setPendingPoints] = useState<PendingPointsRequest | null>(null);

  return {
    showSkillModal, setShowSkillModal, activeTab, setActiveTab, feedbackSource,
    setFeedbackSource, manualPoints, setManualPoints, pendingPoints, setPendingPoints
  };
};

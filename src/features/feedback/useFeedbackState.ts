import React, { useState } from 'react';
import { GameEventSource } from '../../domain/gameEvents';

// State bảng cộng/trừ điểm (Ban thưởng / Phạt).
export const useFeedbackState = () => {
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [feedbackSource, setFeedbackSource] = useState<GameEventSource>('manual');
  const [manualPoints, setManualPoints] = useState<string>('');

  return {
    showSkillModal, setShowSkillModal, activeTab, setActiveTab, feedbackSource,
    setFeedbackSource, manualPoints, setManualPoints
  };
};

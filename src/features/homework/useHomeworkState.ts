import React, { useState } from 'react';
import { HomeworkStatus } from '../../components/HomeworkCheckModal';

// State hộp thoại kiểm tra bài tập.
export const useHomeworkState = () => {
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkStatuses, setHomeworkStatuses] = useState<Record<string, HomeworkStatus>>({});

  return {
    showHomeworkModal, setShowHomeworkModal, homeworkStatuses, setHomeworkStatuses
  };
};

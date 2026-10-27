import React from 'react';
import { HomeworkCheckModal } from '../../components/HomeworkCheckModal';
import { useApp } from '../../app/AppContext';

export const HomeworkModal: React.FC = () => {
  const {
    handleConfirmHomeworkCheck, homeworkLessonDateKey, homeworkStatuses,
    presentStudents, setHomeworkStatus, setShowHomeworkModal, showHomeworkModal,
    toggleHomeworkStatus
  } = useApp();
  return (
    <>
      {showHomeworkModal && (
        <HomeworkCheckModal
          students={presentStudents}
          statuses={homeworkStatuses}
          lessonDateKey={homeworkLessonDateKey}
          onToggle={toggleHomeworkStatus}
          onSetStatus={setHomeworkStatus}
          onConfirm={handleConfirmHomeworkCheck}
          onClose={() => setShowHomeworkModal(false)}
        />
      )}
    </>
  );
};

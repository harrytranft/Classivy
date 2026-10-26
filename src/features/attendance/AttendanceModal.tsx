import React from 'react';
import { AttendanceCheckModal } from '../../components/AttendanceCheckModal';
import { getLocalDateKey } from '../../domain/dates';
import { useApp } from '../../app/AppContext';

export const AttendanceModal: React.FC = () => {
  const {
    attendanceStatuses, currentClassStudents, getRank, handleConfirmAttendanceCheck,
    setAttendanceStatus, setShowAttendanceModal, showAttendanceModal
  } = useApp();
  return (
    <>
      {showAttendanceModal && (
        <AttendanceCheckModal
          students={currentClassStudents}
          statuses={attendanceStatuses}
          lessonDateKey={getLocalDateKey()}
          getRank={getRank}
          onSetStatus={setAttendanceStatus}
          onConfirm={handleConfirmAttendanceCheck}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}
    </>
  );
};

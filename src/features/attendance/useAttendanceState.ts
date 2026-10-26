import React, { useState } from 'react';
import { AttendanceStatus } from '../../types';

// State hộp thoại điểm danh.
export const useAttendanceState = () => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, AttendanceStatus>>({});

  return {
    showAttendanceModal, setShowAttendanceModal, attendanceStatuses, setAttendanceStatuses
  };
};

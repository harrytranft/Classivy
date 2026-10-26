import React, { useState } from 'react';

// State hộp thoại tài khoản giáo viên.
export const useUserModalState = () => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState('');
  const [editingPhotoURL, setEditingPhotoURL] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return {
    showUserModal, setShowUserModal, editingDisplayName, setEditingDisplayName,
    editingPhotoURL, setEditingPhotoURL, profileSaving, setProfileSaving, confirmLogout,
    setConfirmLogout
  };
};

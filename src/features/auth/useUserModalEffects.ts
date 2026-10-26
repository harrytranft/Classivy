import React, { useEffect } from 'react';
import { AppScope } from '../../app/AppContext';

export const useUserModalEffects = (app: AppScope) => {
  const {
    profile, setConfirmLogout, setEditingDisplayName, setEditingPhotoURL, showUserModal
  } = app;

  useEffect(() => {
    if (profile) {
      setEditingDisplayName(profile.displayName || '');
      setEditingPhotoURL(profile.photoURL || '');
    }
    if (!showUserModal) {
      setConfirmLogout(false);
    }
  }, [profile, showUserModal]);
};

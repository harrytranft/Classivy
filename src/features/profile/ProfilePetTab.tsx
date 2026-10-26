import React from 'react';
import { ProfileEggView } from './ProfileEggView';
import { ProfilePetView } from './ProfilePetView';
import { useApp } from '../../app/AppContext';

export const ProfilePetTab: React.FC = () => {
  const {
    editingStudent
  } = useApp();
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {!editingStudent.pet ? (
        /* EGG SCREEN WITH OWNED PETS SELECTION */
        <ProfileEggView />
      ) : (
        /* PET CORNER DETAILED STORE & CUSTOMIZATION */
        <ProfilePetView />
      )}
    </div>
  );
};

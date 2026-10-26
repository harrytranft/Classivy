import React, { useState } from 'react';
import { Student } from '../../types';

// State hồ sơ trainer đang mở.
export const useProfileState = () => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileTab, setProfileTab] = useState<'info' | 'pet' | 'fusion'>('info');
  const [selectedFusionPetDexIds, setSelectedFusionPetDexIds] = useState<number[]>([]);

  return {
    editingStudent, setEditingStudent, profileTab, setProfileTab, selectedFusionPetDexIds,
    setSelectedFusionPetDexIds
  };
};

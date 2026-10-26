import React, { useState } from 'react';

// State màn Cài đặt (form ô Cá Ngựa, khối thu gọn).
export const useSettingsState = () => {
  const [tileFormIndex, setTileFormIndex] = useState<number>(0);
  const [tileFormTitle, setTileFormTitle] = useState<string>('');
  const [tileFormDesc, setTileFormDesc] = useState<string>('');
  const [tileFormIcon, setTileFormIcon] = useState<string>('🚀');
  const [tileFormType, setTileFormType] = useState<'portal' | 'curse' | 'treasure' | 'monster' | 'restart'>('portal');
  const [tileFormValue, setTileFormValue] = useState<number>(3);
  const [editingTileIndex, setEditingTileIndex] = useState<number | null>(null);
  const [settingsCollapsed, setSettingsCollapsed] = useState<Record<string, boolean>>({
    weather: true,
    sound: true,
    skills: true,
    petSkills: true,
    pokemonReset: true,
    ludo: true,
    luckyWheel: true,
    data: true
  });

  return {
    tileFormIndex, setTileFormIndex, tileFormTitle, setTileFormTitle, tileFormDesc,
    setTileFormDesc, tileFormIcon, setTileFormIcon, tileFormType, setTileFormType,
    tileFormValue, setTileFormValue, editingTileIndex, setEditingTileIndex, settingsCollapsed,
    setSettingsCollapsed
  };
};

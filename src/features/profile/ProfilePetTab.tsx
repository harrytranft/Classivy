import React from 'react';
import { ProfileEggView } from './ProfileEggView';
import { ProfilePetView } from './ProfilePetView';
import { ProfileSkillLab } from './ProfileSkillLab';
import { EggInventoryPanel } from './EggInventoryPanel';
import { ExpeditionPanel } from './ExpeditionPanel';
import { WeeklyChestPanel } from './WeeklyChestPanel';
import { useApp } from '../../app/AppContext';

// Tab Pokémon (Phase 12D, D45). Thứ tự: đồng hành/trứng, Pokémon đã sở hữu, Hợp nhất (ngay dưới danh sách sở hữu),
// kỹ năng đang có, Kho trứng / Thám hiểm / Rương tuần (mỗi panel một lần), rồi Pokémon Skill Lab ở cuối cùng.
export const ProfilePetTab: React.FC = () => {
  const { editingStudent, setSelectedFusionPetDexIds } = useApp();
  // Vào tab Pokémon thì bỏ lựa chọn hợp nhất còn sót từ lần trước.
  React.useEffect(() => { setSelectedFusionPetDexIds([]); }, [editingStudent.id, setSelectedFusionPetDexIds]);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {!editingStudent.pet ? <ProfileEggView /> : <ProfilePetView />}
      <EggInventoryPanel student={editingStudent} />
      <ExpeditionPanel student={editingStudent} />
      <WeeklyChestPanel student={editingStudent} />
      {editingStudent.pet && <ProfileSkillLab />}
    </div>
  );
};

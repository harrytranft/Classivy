import React from 'react';
import { UsersRound } from 'lucide-react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { Button, Card, Chip, Modal } from '../../components/ui';
import { useApp } from '../../app/AppContext';

export const GroupModal: React.FC = () => {
  const {
    generatedGroups, groupSize, handleMakeGroups, setGroupSize, setShowGroupModal,
    showGroupModal
  } = useApp();
  if (!showGroupModal) return null;
  return <Modal onClose={() => setShowGroupModal(false)} title="Chia nhóm tự động" subtitle="Tạo nhóm cân bằng chỉ trong một lần bấm" icon={<UsersRound aria-hidden />} size="full" zIndex="z-[100]">
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="bg-[#f4f8f1] text-center"><h3 className="text-lg font-extrabold text-brand-ink">Số Trainer tối đa trong mỗi nhóm</h3><div className="mt-4 flex flex-wrap justify-center gap-2">{[2, 3, 4, 5, 6, 7, 8].map(number => <Button key={number} variant={groupSize === number ? 'primary' : 'secondary'} className="w-12 px-0" onClick={() => setGroupSize(number)} aria-pressed={groupSize === number}>{number}</Button>)}</div><Button className="mt-5" size="lg" onClick={handleMakeGroups}>Tạo nhóm</Button></Card>
      {generatedGroups.length > 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{generatedGroups.map((group, index) => <Card key={index} className="space-y-3"><div className="flex items-center justify-between border-b border-[#e6e2d4] pb-3"><h3 className="text-lg font-extrabold text-brand-ink">Nhóm {index + 1}</h3><Chip tone="leaf">{group.length} Trainer</Chip></div><ul className="space-y-2">{group.map(student => <li key={student.id} className="flex items-center gap-3 rounded-brand-md bg-[#f4f8f1] p-3"><StudentAvatar student={student} className="h-10 w-10 rounded-full border border-white" /><span className="min-w-0 truncate font-bold text-brand-ink">{student.name}</span></li>)}</ul></Card>)}</div>}
    </div>
  </Modal>;
};

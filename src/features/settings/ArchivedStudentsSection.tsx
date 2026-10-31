import React from 'react';
import { ArchiveRestore } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { useApp } from '../../app/AppContext';
import { Button } from '../../components/ui';
import { StudentAvatar } from '../../components/StudentAvatar';

// Học sinh đã lưu trữ (ẩn khỏi các trang của lớp). Bấm "Bỏ lưu trữ" để em hiện lại trong lớp cũ.
const formatDate = (ms?: number) => (ms ? new Date(ms).toLocaleDateString('vi-VN') : '');

export const ArchivedStudentsSection: React.FC = () => {
  const { archivedStudents, settingsCollapsed, toggleSettingsSection, unarchiveStudent } = useApp();
  const sorted = [...archivedStudents].sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));

  return (
    <SettingsSection
      id="archivedStudents"
      icon="🗄️"
      title="Học sinh đã lưu trữ"
      subtitle="Các em đã lưu trữ bị ẩn khỏi mọi trang của lớp. Bỏ lưu trữ để em hiện lại, điểm và Pokémon vẫn giữ nguyên."
      collapsedSections={settingsCollapsed}
      onToggle={toggleSettingsSection}
    >
      {sorted.length === 0 ? (
        <p className="text-sm text-brand-ink/70" data-testid="archived-empty">Chưa có học sinh nào được lưu trữ. Lưu trữ một em bằng nút "Lưu trữ" trong Hồ sơ Trainer.</p>
      ) : (
        <ul className="divide-y divide-[#efece2]" data-testid="archived-list">
          {sorted.map(student => (
            <li key={student.id} className="flex items-center gap-3 py-3" data-testid="archived-student">
              <StudentAvatar student={student} className="h-10 w-10 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-brand-ink">{student.name}</p>
                <p className="text-xs text-brand-ink/70 tabular-nums">
                  Lớp {student.className} · {student.points} Hào Quang{student.archivedAt ? ` · lưu trữ ngày ${formatDate(student.archivedAt)}` : ''}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<ArchiveRestore className="h-4 w-4" aria-hidden />}
                onClick={() => unarchiveStudent(student.id)}
                aria-label={`Bỏ lưu trữ ${student.name}`}
              >
                Bỏ lưu trữ
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
};

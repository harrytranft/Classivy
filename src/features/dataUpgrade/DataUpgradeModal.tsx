import React, { useEffect, useState } from 'react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../app/AppContext';
import { previewLegacyUpgrade, runLegacyUpgrade } from '../../app/providers/gameData/cloudStore';
import { LegacyImportPlan } from '../../domain/legacyImport';
import { normalizeStudentPokemonData } from '../../domain/pokemonProgression';
import { compressStudentAvatars } from '../../lib/imageCompression';
import { Student } from '../../types';

// Phase 3 (ADR mục 6): chuyển dữ liệu cũ sang bảng mới do giáo viên bấm.
// Chạy thử -> tải bản sao lưu -> ghi -> đọc lại đối chiếu -> bật bảng mới. Lỗi thì giữ cách lưu cũ.

type Step =
  | { kind: 'checking' }
  | { kind: 'preview'; plan: LegacyImportPlan; students: Student[] }
  | { kind: 'running' }
  | { kind: 'done'; studentCount: number; classCount: number }
  | { kind: 'error'; messages: string[] };

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

export const DataUpgradeModal: React.FC = () => {
  const {
    user, students, bossStatesByClass, setStudents, legacyUpgradeAvailable, setLegacyUpgradeAvailable,
    cloudDataModelRef, lastCloudSnapshotRef, handleExportJSON
  } = useApp();
  const [step, setStep] = useState<Step>({ kind: 'checking' });

  const check = async () => {
    setStep({ kind: 'checking' });
    try {
      const compressed = await compressStudentAvatars(students);
      const plan = await previewLegacyUpgrade({ students: compressed, bossStatesByClass });
      setStep({ kind: 'preview', plan, students: compressed });
    } catch (err) {
      console.error('Upgrade preview failed', err);
      setStep({ kind: 'error', messages: ['Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.'] });
    }
  };

  useEffect(() => {
    // Chỉ chạy thử khi hộp thoại mở ra.
    if (legacyUpgradeAvailable) check();
  }, [legacyUpgradeAvailable]);

  if (!legacyUpgradeAvailable || !user) return null;

  const close = () => {
    if (step.kind !== 'running') setLegacyUpgradeAvailable(false);
  };

  const upgrade = async (upgradeStudents: Student[]) => {
    handleExportJSON(); // bản sao lưu trên máy trước khi ghi
    setStep({ kind: 'running' });
    try {
      const result = await runLegacyUpgrade(user.uid, { students: upgradeStudents, bossStatesByClass });
      if (result.ok === false) {
        setStep({ kind: 'error', messages: result.problems });
        return;
      }
      cloudDataModelRef.current = 'tables';
      lastCloudSnapshotRef.current = result.snapshot;
      setStudents(result.snapshot.students.map(normalizeStudentPokemonData));
      setStep({
        kind: 'done',
        studentCount: result.snapshot.students.length,
        classCount: new Set(result.snapshot.students.map(s => s.className)).size
      });
    } catch (err) {
      console.error('Upgrade failed', err);
      setStep({ kind: 'error', messages: ['Mất kết nối giữa chừng. Dữ liệu cũ vẫn an toàn; bấm "Thử lại" để chuyển tiếp phần còn lại.'] });
    }
  };

  const footer = (() => {
    switch (step.kind) {
      case 'preview':
        return (
          <>
            <Button variant="secondary" onClick={close}>Để sau</Button>
            <Button onClick={() => upgrade(step.students)} disabled={step.plan.problems.length > 0}>
              Tải bản sao lưu và nâng cấp
            </Button>
          </>
        );
      case 'done':
        return <Button onClick={() => setLegacyUpgradeAvailable(false)}>Tiếp tục</Button>;
      case 'error':
        return (
          <>
            <Button variant="secondary" onClick={close}>Để sau</Button>
            <Button onClick={check}>Thử lại</Button>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <Modal
      onClose={close}
      title="Nâng cấp cách lưu dữ liệu"
      subtitle="Chuẩn bị cho tài khoản học sinh"
      icon="🛡️"
      zIndex="z-[300]"
      closeOnBackdrop={false}
      hideClose={step.kind === 'running'}
      footer={footer}
    >
      <div className="space-y-4 text-sm text-brand-ink" data-testid="data-upgrade">
        {step.kind === 'checking' && (
          <p className="font-semibold text-brand-ink/70">Đang kiểm tra dữ liệu của thầy cô...</p>
        )}

        {step.kind === 'preview' && (
          <>
            <p>
              Classivy có cách lưu mới: mỗi học sinh một hồ sơ riêng và lịch sử điểm được giữ đầy đủ.
              Dữ liệu cũ vẫn được giữ nguyên làm bản dự phòng.
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Lớp', step.plan.summary.classCount],
                ['Học sinh', step.plan.summary.studentCount],
                ['Dòng lịch sử', step.plan.summary.historyCount],
                ['Tổng Hào Quang', step.plan.summary.totalPoints]
              ].map(([label, value]) => (
                <div key={label} className="rounded-brand-md bg-brand-cream px-3 py-2">
                  <dt className="text-xs font-bold text-brand-ink/60">{label}</dt>
                  <dd className="text-lg font-extrabold text-brand-forest">{formatNumber(Number(value))}</dd>
                </div>
              ))}
            </dl>
            {step.plan.problems.length > 0 && (
              <div className="rounded-brand-md border border-brand-danger/30 bg-brand-danger/5 p-3">
                <p className="font-bold text-brand-danger">Cần sửa trước khi nâng cấp:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {step.plan.problems.map(problem => <li key={problem}>{problem}</li>)}
                </ul>
              </div>
            )}
            {step.plan.warnings.length > 0 && (
              <div className="rounded-brand-md bg-brand-gold/15 p-3">
                <p className="font-bold">Lưu ý:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {step.plan.warnings.map(warning => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}
            <p className="text-xs text-brand-ink/60">
              Khi bấm nâng cấp, Classivy tải một file sao lưu về máy trước, sau đó chuyển dữ liệu và đối chiếu lại từng học sinh.
            </p>
          </>
        )}

        {step.kind === 'running' && (
          <p className="font-semibold">Đang chuyển và đối chiếu dữ liệu... Thầy cô đừng đóng trang nhé.</p>
        )}

        {step.kind === 'done' && (
          <p className="font-semibold text-brand-forest">
            Xong! Đã chuyển {formatNumber(step.studentCount)} học sinh ({formatNumber(step.classCount)} lớp) và đối chiếu khớp.
          </p>
        )}

        {step.kind === 'error' && (
          <div className="space-y-2">
            <p className="font-semibold">Chưa nâng cấp được. Dữ liệu cũ vẫn an toàn và app tiếp tục dùng cách lưu cũ.</p>
            <ul className="list-disc space-y-0.5 pl-5 text-brand-ink/80">
              {step.messages.map(message => <li key={message}>{message}</li>)}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

import React from 'react';
import { History } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { auditActionLabel } from '../../domain/accountView';
import type { AuditEntry } from './useClassAccounts';

const formatTime = (iso: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
}).format(new Date(iso));

const describeDetail = (entry: AuditEntry): string => {
  const username = entry.detail.username;
  if (typeof username === 'string') return `tên đăng nhập ${username}`;
  if (entry.action === 'delete_student') return entry.detail.had_account ? 'kèm tài khoản đăng nhập' : 'chưa có tài khoản';
  return '';
};

/** Nhật ký thao tác của giáo viên với tài khoản học sinh trong lớp (100 dòng gần nhất). Không bao giờ có mật khẩu. */
export const AuditLogPanel: React.FC<{ entries: AuditEntry[] }> = ({ entries }) => {
  if (entries.length === 0) {
    return <EmptyState icon={<History className="h-8 w-8" />} title="Chưa có thao tác nào" description="Mỗi lần tạo, khoá, đặt lại mật khẩu, thu hồi tài khoản hoặc xoá học sinh sẽ được ghi lại ở đây." />;
  }
  return (
    <ul className="divide-y divide-[#efece2] overflow-hidden rounded-brand-lg border border-[#e6e2d4] bg-white">
      {entries.map(entry => (
        <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
          <span className="w-36 shrink-0 text-xs font-semibold text-brand-ink/60">{formatTime(entry.createdAt)}</span>
          <span className="font-extrabold text-brand-ink">{auditActionLabel(entry.action)}</span>
          <span className="text-brand-ink">{entry.studentName}</span>
          <span className="text-xs text-brand-ink/60">{describeDetail(entry)}</span>
        </li>
      ))}
    </ul>
  );
};

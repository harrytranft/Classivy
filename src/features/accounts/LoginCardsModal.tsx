import React from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import type { Credential } from './studentAccountsApi';

// Khi in: ẩn toàn bộ app (#root), chỉ hiện vùng thẻ đặt trong #print-root (portal gắn vào <body>).
const PRINT_CSS = `
#login-cards-print { display: none; }
@media print {
  #root { display: none !important; }
  #login-cards-print { display: block !important; }
  @page { margin: 12mm; }
}`;

const LoginCard: React.FC<{ credential: Credential; origin: string }> = ({ credential, origin }) => (
  <div style={{ border: '1.5px solid #014a2d', borderRadius: 12, padding: 14, breakInside: 'avoid', fontFamily: 'system-ui, sans-serif', color: '#0c2527' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <strong style={{ fontSize: 16, color: '#014a2d' }}>Classivy</strong>
      <span style={{ fontSize: 12 }}>{credential.className ?? ''}</span>
    </div>
    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{credential.name}</div>
    <div style={{ fontSize: 13, marginBottom: 2 }}>Tên đăng nhập</div>
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{credential.username}</div>
    <div style={{ fontSize: 13, marginBottom: 2 }}>Mật khẩu</div>
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{credential.password}</div>
    <div style={{ fontSize: 11, color: '#555' }}>Vào {origin}. Lần đầu đăng nhập em sẽ được đặt mật khẩu mới. Không chia sẻ thẻ này.</div>
  </div>
);

/** Hộp "Thẻ đăng nhập": mật khẩu chỉ hiện ở đây MỘT LẦN (không lưu ở đâu), đóng hộp là mất. */
export const LoginCardsModal: React.FC<{ credentials: Credential[]; onClose: () => void }> = ({ credentials, onClose }) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <>
      <Modal
        size="xl"
        zIndex="z-[300]"
        title="Thẻ đăng nhập"
        subtitle="Mật khẩu chỉ hiện một lần. In hoặc chép lại ngay trước khi đóng; nếu mất, hãy đặt lại mật khẩu."
        closeOnBackdrop={false}
        onClose={onClose}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
            <Button icon={<Printer className="h-[18px] w-[18px]" aria-hidden />} onClick={() => window.print()}>In thẻ</Button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map(c => (
            <div key={c.studentId} className="rounded-brand-md border border-[#e6e2d4] bg-brand-cream p-4">
              <p className="text-xs font-bold text-brand-ink/60">{c.className ?? ''}</p>
              <p className="font-extrabold text-brand-ink">{c.name}</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div><dt className="text-xs text-brand-ink/60">Tên đăng nhập</dt><dd className="font-mono text-base font-bold text-brand-forest">{c.username}</dd></div>
                <div><dt className="text-xs text-brand-ink/60">Mật khẩu</dt><dd className="font-mono text-base font-bold tracking-wide text-brand-ink">{c.password}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </Modal>
      {createPortal(
        <div id="login-cards-print">
          <style>{PRINT_CSS}</style>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {credentials.map(c => <LoginCard key={c.studentId} credential={c} origin={origin} />)}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

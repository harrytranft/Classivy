import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[1400px]'
};

export interface ModalProps {
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Icon hoặc emoji nội dung game hiển thị cạnh tiêu đề. */
  icon?: React.ReactNode;
  size?: ModalSize;
  /** Giữ đúng thứ tự chồng lớp như bản cũ (ví dụ 'z-[220]'). */
  zIndex?: string;
  closeLabel?: string;
  /** Bấm ra ngoài để đóng (mặc định có). */
  closeOnBackdrop?: boolean;
  /** Ẩn nút X (khi hộp thoại có nút đóng riêng). */
  hideClose?: boolean;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

// Các hộp thoại đang mở, theo thứ tự chồng lên nhau: Esc chỉ đóng hộp trên cùng.
const openStack: symbol[] = [];

/**
 * Khung hộp thoại Classivy: nền mờ xanh đậm, thẻ trắng bo 22px, tiêu đề + nút X, phím Esc để đóng.
 * Chỉ render khi được gọi (nơi dùng vẫn tự quyết định hiện/ẩn như cũ).
 */
export const Modal: React.FC<ModalProps> = ({
  onClose, title, subtitle, icon, size = 'md', zIndex = 'z-[100]', closeLabel = 'Đóng', closeOnBackdrop = true,
  hideClose, footer, className, bodyClassName, children
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const token = Symbol('modal');
    openStack.push(token);
    // Đưa focus vào hộp thoại để Tab/Esc hoạt động ngay; khi đóng thì trả focus về chỗ cũ.
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openStack[openStack.length - 1] === token) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openStack.splice(openStack.indexOf(token), 1);
      if (previous && document.contains(previous)) previous.focus();
    };
  }, []);

  return (
    <div
      className={cx('fixed inset-0 flex items-center justify-center bg-brand-forest-deep/60 p-0 sm:p-4 animate-in fade-in duration-150', zIndex)}
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? titleId : undefined}
        className={cx(
          'relative flex max-h-full w-full flex-col overflow-hidden bg-white outline-none shadow-[0_24px_60px_-18px_rgba(0,38,25,0.55)] sm:max-h-[92vh] sm:rounded-brand-lg',
          SIZES[size], className
        )}
      >
        {(title || !hideClose) && (
          <div className={cx('flex shrink-0 items-start gap-3 px-6 pt-5', title ? 'pb-4 border-b border-[#efece2]' : 'pb-0')}>
            {icon && <div className="grid h-11 w-11 shrink-0 place-items-center rounded-brand-md bg-[#f2f6ef] text-2xl text-brand-forest">{icon}</div>}
            <div className="min-w-0 flex-1">
              {title && <h2 id={titleId} className="text-xl font-extrabold leading-tight text-brand-ink">{title}</h2>}
              {subtitle && <p className="mt-1 text-sm text-brand-ink/70">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="-mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-forest/[0.07] hover:text-brand-forest"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        )}
        <div className={cx('min-h-0 flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#efece2] bg-[#fbfaf5] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

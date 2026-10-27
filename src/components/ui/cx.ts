/** Ghép class Tailwind, bỏ giá trị rỗng/false. */
export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');

// Chuyển khoá localStorage cũ `imperial_*` sang `classivy_*` một lần (task 2.7).
// - Chỉ chép khi khoá mới chưa có giá trị, nên không bao giờ ghi đè dữ liệu mới.
// - Khoá cũ giữ nguyên để có thể hoàn tác (xoá khoá mới + cờ đánh dấu rồi tải lại trang).
// - Chạy xong ghi cờ đánh dấu; lần mở sau bỏ qua, kể cả khi khoá mới bị xoá về sau.

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface StorageMigrationResult {
  /** false nếu đã chuyển từ trước (có cờ) hoặc không truy cập được bộ nhớ. */
  ran: boolean;
  copiedKeys: string[];
}

export const migrateLegacyStorageKeys = (
  storage: KeyValueStorage,
  legacyKeys: Record<string, string>,
  markerKey: string,
  now: number = Date.now()
): StorageMigrationResult => {
  try {
    if (storage.getItem(markerKey) !== null) return { ran: false, copiedKeys: [] };

    const copiedKeys: string[] = [];
    Object.entries(legacyKeys).forEach(([newKey, oldKey]) => {
      if (storage.getItem(newKey) !== null) return;
      const oldValue = storage.getItem(oldKey);
      if (oldValue === null) return;
      storage.setItem(newKey, oldValue);
      copiedKeys.push(newKey);
    });

    storage.setItem(markerKey, String(now));
    return { ran: true, copiedKeys };
  } catch (err) {
    // Trình duyệt chặn localStorage (chế độ riêng tư) hoặc hết dung lượng: app vẫn chạy như máy mới.
    console.error('Classivy storage migration failed', err);
    return { ran: false, copiedKeys: [] };
  }
};

import { AVATAR_MAX_LENGTH } from '../domain/cloudModel';
import { Student } from '../types';

// Ảnh đại diện học sinh lưu dạng base64 trong DB (Q5, tạm tới Phase 5): nén ảnh quá lớn
// về JPEG nhỏ hơn AVATAR_MAX_LENGTH ký tự. Ảnh đã đủ nhỏ giữ nguyên.

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Không đọc được ảnh'));
  image.src = src;
});

export const compressImageDataUrl = async (dataUrl: string, maxLength = AVATAR_MAX_LENGTH): Promise<string> => {
  if (dataUrl.length <= maxLength || !dataUrl.startsWith('data:image/')) return dataUrl;
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  for (const side of [512, 384, 256, 192, 128]) {
    const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.fillStyle = '#ffffff'; // JPEG không có nền trong suốt
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= maxLength) return result;
    }
  }
  return dataUrl;
};

/** Nén ảnh đại diện quá lớn của cả danh sách (học sinh không đổi thì giữ nguyên đối tượng). */
export const compressStudentAvatars = async (students: Student[]): Promise<Student[]> =>
  Promise.all(students.map(async student => {
    if (!student.customAvatar || student.customAvatar.length <= AVATAR_MAX_LENGTH) return student;
    try {
      return { ...student, customAvatar: await compressImageDataUrl(student.customAvatar) };
    } catch (err) {
      console.error('Avatar compression failed', err);
      return student;
    }
  }));

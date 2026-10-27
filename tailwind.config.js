/** @type {import('tailwindcss').Config} */
// Tailwind 3.4 build local (thay cho cdn.tailwindcss.com, cũng là v3) để giữ nguyên giao diện hiện tại.
// Token Classivy lấy từ DESIGN.md, đặt dưới tiền tố `brand-` để không đụng bảng màu mặc định
// (emerald, violet... đang được dùng khắp nơi). Ví dụ: bg-brand-forest, text-brand-ink, rounded-brand-lg.
const BRAND_FONT = ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'];

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          'forest-deep': '#002619',
          forest: '#014a2d',
          wordmark: '#044f38',
          emerald: '#298353',
          leaf: '#53c777',
          'leaf-soft': '#a9d584',
          gold: '#f3bc4c',
          'gold-deep': '#dbbe58',
          'gold-light': '#fef1a5',
          violet: '#984fc2',
          'violet-deep': '#7036a3',
          'violet-soft': '#bb66dd',
          cream: '#fefdf9',
          ink: '#0c2527',
          danger: '#c0392b',
          warning: '#f3bc4c',
          success: '#298353'
        }
      },
      backgroundImage: {
        // Nền xanh của biểu tượng app (đo từ public/brand/classivy-app-icon-dark.png): sáng ở trên, đậm dần xuống dưới.
        'brand-shield': 'linear-gradient(180deg, #0a9a69 0px, #04774f 84px, #015638 280px, #01482f 65%, #043624 100%)'
      },
      // Một họ chữ duy nhất cho toàn app: ghi đè `sans` (mặc định của Tailwind, dùng cho <html> và class font-sans)
      // để không còn chỗ nào rơi về phông hệ thống. `font-brand` giữ làm tên gọi khác.
      fontFamily: {
        sans: BRAND_FONT,
        brand: BRAND_FONT
      },
      borderRadius: {
        'brand-sm': '8px',
        'brand-md': '14px',
        'brand-lg': '22px'
      }
    }
  },
  plugins: []
};

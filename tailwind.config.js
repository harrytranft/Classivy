/** @type {import('tailwindcss').Config} */
// Tailwind 3.4 build local (thay cho cdn.tailwindcss.com, cũng là v3) để giữ nguyên giao diện hiện tại.
// Token Classivy lấy từ DESIGN.md, đặt dưới tiền tố `brand-` để không đụng bảng màu mặc định
// (emerald, violet... đang được dùng khắp nơi). Ví dụ: bg-brand-forest, text-brand-ink, rounded-brand-lg.
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
      fontFamily: {
        brand: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif']
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

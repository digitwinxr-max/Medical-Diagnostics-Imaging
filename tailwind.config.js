module.exports = {
  darkMode: 'class',
  content: ["./*.html", "./js/*.js"],
  theme: {
    extend: {
      colors: {
        'primary-navy': '#062C5A',
        'primary-navy-dark': '#021329',
        'secondary-blue': '#0D4C92',
        'accent-cyan': '#00C2FF',
        'bg-slate': '#F8FAFC',
        'text-dark': '#0F172A',
        'text-muted': '#64748B',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      }
    }
  },
  plugins: [],
}

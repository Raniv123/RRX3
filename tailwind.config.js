/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#3B82F6',
        'vibrant-green': '#10B981',
        'deep-purple': '#8B5CF6',
        'hot-cyan': '#22D3EE',
        'fire-red': '#EF4444',
        'sexy-fuchsia': '#E879F9',
        'bordeaux': '#6B0F1A',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 121, 249, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(232, 121, 249, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

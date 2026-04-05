/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#1c1f1a',
        card: '#252822',
        border: '#3a3f35',
        green: {
          accent: '#7ab83e',
          button: '#4a7a20',
          dark: '#2a3d10',
        },
        text: {
          secondary: '#9aaa8a',
        },
        orange: {
          badge: '#d97706',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

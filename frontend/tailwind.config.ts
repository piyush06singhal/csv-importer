import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Dark Slate base
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#8b5cf6', // Violet accent
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#10b981', // Emerald success accent
          foreground: '#ffffff',
        },
        border: '#27272a', // Slate border tint
      },
    },
  },
  plugins: [],
};
export default config;

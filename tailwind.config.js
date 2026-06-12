/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                metro: {
                    900: '#0f172a', // Dark background
                    800: '#1e293b', // Panel background
                    700: '#334155', // Border
                    500: '#3b82f6', // Primary Action
                    400: '#60a5fa', // Secondary Action
                    success: '#22c55e',
                    warning: '#eab308',
                    danger: '#ef4444',
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

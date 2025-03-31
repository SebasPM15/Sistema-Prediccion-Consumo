/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}' // Si usas estructura src/
    ],
    theme: {
        extend: {
            colors: {
                rose: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    500: '#dc2626',
                    700: '#b91c1c',
                },
                emerald: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    500: '#059669',
                    700: '#047857',
                },
                amber: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    500: '#d97706',
                    700: '#b45309',
                },
                sky: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0284c7',
                    700: '#0369a1',
                }
            }
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
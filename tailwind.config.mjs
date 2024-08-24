import formsPlugin from '@tailwindcss/forms';
import typographyPlugin from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'selector',
    theme: {
        extend: {
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        img: {
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            display: 'block', // Ensures the image is centered
                        },
                    },
                },
            }),
        },
    },
    plugins: [
        formsPlugin,
        typographyPlugin
    ],
}

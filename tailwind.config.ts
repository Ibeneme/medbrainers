// tailwind.config.ts
import { PRIMARY_COLOR } from "@/constants/colors";
import type { Config } from "tailwindcss";


const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: PRIMARY_COLOR, // bg-primary, text-primary, border-primary, bg-primary/20
                    hover: "var(--color-primary-hover)", // hover:bg-primary-hover
                    light: "var(--color-primary-light)", // text-primary-light
                    tint: "var(--color-primary-tint)", // bg-primary-tint
                    deep: {
                        DEFAULT: "var(--color-primary-deep)", // bg-primary-deep
                        hover: "var(--color-primary-deep-hover)", // hover:bg-primary-deep-hover
                    },
                },
            },
        },
    },
};

export default config;
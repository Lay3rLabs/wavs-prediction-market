/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        // Neutral Dark (Backgrounds & Surfaces)
        neutral: {
          900: "#1E1E1E", // Base background / body
          850: "#222020", // Cards, sections
          800: "#2D2A2A", // Elevated cards
          700: "#383232", // Borders, strokes
          600: "#443939", // Dividers, sub-elements
          500: "#A89F96", // Secondary text
          400: "#B9AFA4", // Placeholder / disabled
          300: "#CEC3B7", // Light strokes / outlines
          200: "#DDD2C6", // Cards on light background
          100: "#F2EAE2", // Inverted BG / highlights
        },
        // Primary Lavender (Brand Accent)
        primary: {
          900: "#4A345D", // Strong emphasis / CTA hover
          800: "#62497B", // CTA buttons / badges
          700: "#8265A1", // Accent highlights / tags
          600: "#9D7DC5", // Links / focus rings
          500: "#B49ADC", // Background tints / icons
        },
        // Green Success
        success: {
          900: "#255E52", // Strong success / BG
          800: "#2F7B69", // Filled success UI
          700: "#3E9C81", // Icons / chips
          600: "#52B79D", // Text / buttons
          500: "#73D4BB", // Tags / faded BG
        },
        // Red Alert/Error
        alert: {
          900: "#5B3A42", // Error backgrounds
          800: "#814B56", // Filled warnings
          700: "#A7656F", // Icon / text warning
          600: "#C38D99", // Subtle alerts
          500: "#D8A9B5", // Light alert tags
        },
      },
      fontSize: {
        "title-xl": ["50px", { lineHeight: "1.1", fontWeight: "600" }], // Hero titles
        "title-m": ["38px", { lineHeight: "1.1", fontWeight: "700" }], // Section headers
        "title-s": ["28px", { lineHeight: "1.2", fontWeight: "700" }], // Widget titles
        "body-m": ["22px", { lineHeight: "1.4", fontWeight: "400" }], // Paragraphs
        "body-s": ["18px", { lineHeight: "1.4", fontWeight: "400" }], // Secondary text
        "button-m": ["22px", { lineHeight: "1.2", fontWeight: "700" }], // Main buttons
        "button-s": ["18px", { lineHeight: "1.2", fontWeight: "700" }], // Small buttons
      },
      spacing: {
        xs: "4px", // spaceXS - Icon padding / border-radius
        s: "8px", // spaceS - Small gaps
        m: "16px", // spaceM - Standard UI padding
        l: "24px", // spaceL - Section spacing
        xl: "32px", // spaceXL - Full-page layout padding
      },
      borderRadius: {
        "card-1": "34px", // Elevation 1 cards
        "card-2": "15px", // Elevation 2 cards
        button: "99999px", // Button radius
      },
      boxShadow: {
        "card-2": "12px 12px 24px rgba(0, 0, 0, 0.15)", // Elevation 2 card shadow
        button: "0 8px 8px rgba(226, 212, 198, 0.3)", // Button shadow
        glow: "0 8px 8px rgba(231, 212, 198, 0.3)", // Title/logo glow
        "inner-glow": "inset 0 8px 8px rgba(231, 212, 198, 0.3)", // Inner glow
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Soft easing
      },
      transitionDuration: {
        250: "250ms",
      },
      height: {
        "button-m": "48px", // Medium button height
        "button-s": "36px", // Small button height
      },
    },
  },
  plugins: [],
};

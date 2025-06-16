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
          400: "#C4B5E8", // Light primary
          300: "#D4C9F0", // Lighter primary
          200: "#E4DDF8", // Very light primary
          100: "#F4F1FC", // Minimal primary
          50: "#FAFAFE", // Barely visible primary
        },
        // Green Success
        success: {
          900: "#064e3b", // Strong success / BG
          800: "#065f46", // Filled success UI
          700: "#047857", // Icons / chips
          600: "#059669", // Text / buttons
          500: "#10b981", // Tags / faded BG
          400: "#34d399", // Light success
          300: "#6ee7b7", // Lighter success
          200: "#a7f3d0", // Very light success
          100: "#d1fae5", // Minimal success
          50: "#ecfdf5", // Barely visible success
        },
        // Red Alert/Error
        alert: {
          900: "#7f1d1d", // Error backgrounds
          800: "#991b1b", // Filled warnings
          700: "#dc2626", // Icon / text warning
          600: "#ef4444", // Subtle alerts
          500: "#f87171", // Light alert tags
          400: "#fca5a5", // Very light alert
          300: "#fecaca", // Lighter alert
          200: "#fecdd3", // Very light alert
          100: "#fee2e2", // Minimal alert
          50: "#fef2f2", // Barely visible alert
        },
      },
      fontSize: {
        "title-xl": ["32px", { lineHeight: "1.1", fontWeight: "600" }], // Hero titles
        "title-m": ["24px", { lineHeight: "1.2", fontWeight: "700" }], // Section headers
        "title-s": ["20px", { lineHeight: "1.3", fontWeight: "600" }], // Widget titles
        "body-m": ["16px", { lineHeight: "1.5", fontWeight: "400" }], // Paragraphs
        "body-s": ["14px", { lineHeight: "1.4", fontWeight: "400" }], // Secondary text
        "body-xs": ["12px", { lineHeight: "1.4", fontWeight: "400" }], // Tiny text
        "button-m": ["16px", { lineHeight: "1.2", fontWeight: "600" }], // Main buttons
        "button-s": ["14px", { lineHeight: "1.2", fontWeight: "500" }], // Small buttons
        pill: ["12px", { lineHeight: "1.2", fontWeight: "500" }], // Pills and badges
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
        "card-1": "0 2px 8px rgba(0, 0, 0, 0.08)", // Subtle card shadow
        "card-2": "0 8px 32px rgba(0, 0, 0, 0.24)", // Elevation 2 card shadow
        "card-hover": "0 12px 40px rgba(0, 0, 0, 0.32)", // Hover state shadow
        button: "0 4px 12px rgba(0, 0, 0, 0.15)", // Button shadow
        "button-hover": "0 6px 16px rgba(0, 0, 0, 0.20)", // Button hover shadow
        glow: "0 0 20px rgba(157, 125, 197, 0.15)", // Title/logo glow
        "inner-glow": "inset 0 2px 4px rgba(0, 0, 0, 0.06)", // Inner glow
        pill: "0 2px 4px rgba(0, 0, 0, 0.1)", // Pill shadow
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
        "button-m": "40px", // Medium button height
        "button-s": "32px", // Small button height
        pill: "24px", // Pill height
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

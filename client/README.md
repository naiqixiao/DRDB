# DRDB Frontend (client) - Customization Guide

This guide explains how to customize the visual appearance of the DRDB frontend application.

## 🎨 Colors & Theme

The application uses a dual-layer styling system: Vuetify theme for components and a custom Design System for global variables.

### 1. Brand Colors (Vuetify)
To change the primary brand colors (buttons, toolbars, active states), modify the theme configuration in:
`src/main.js`

Look for the `colors` object:
```javascript
colors: {
  primary: '#1E40AF',   // Main brand color
  secondary: '#3B82F6', // Accent color
  background: '#F8FAFC', // App background
  warning: '#F59E0B',   // Warning states
  // ...
}
```

### 2. Global Design Variables
Detailed styling for spacing, borders, shadows, and status badges is managed via CSS variables in:
`src/design-system.css`

You can change status colors and field appearances here:
```css
:root {
  --ds-success: #10B981;
  --ds-error: #EF4444;
  --ds-radius-md: 8px;
  /* Font Families */
  --ds-font-family-heading: 'Fira Code', monospace;
  --ds-font-family-body: 'Fira Sans', sans-serif;
}
```

---

## 🖼️ Logo & Branding

### 1. Replacing the Logo
The logo used on the login page is located at:
`src/assets/logo.png`

Simply replace this file with your own logo. Ensure the aspect ratio remains consistent or update the `height` in `src/views/Login.vue`.

### 2. Changing the App Name
To update the "DRDB" text displayed on the login screen, edit:
`src/views/Login.vue` (around line 11)

---

## 🔡 Fonts

The system defaults to **Fira Code** for headings and **Fira Sans** for body text. To use different fonts:

1.  Import your desired fonts in `index.html` or `src/design-system.css`.
2.  Update the `--ds-font-family-heading` and `--ds-font-family-body` variables in `src/design-system.css`.

---

## 🚀 Development

To start the development server:
```bash
npm install
npm run dev
```

---
name: vue-ui-modernizer
description: Use this skill when requested to update, refactor, or redesign existing VueJS components. It applies modern Vue 3 (Composition API) patterns and upgrades the visual UI/UX using our standard utility classes.
---

## Goal
Transform legacy VueJS components into highly accessible, modern, and aesthetically pleasing interfaces using the latest UX best practices.

## Instructions
1. **Code Modernization:** Analyze the `.vue` file. If it uses the Vue 2 Options API, rewrite it using the Vue 3 `<script setup>` syntax while preserving all reactive logic and emitted events.
2. **Visual Hierarchy:** Update the template to establish a clear visual hierarchy. Ensure primary actions (e.g., "Save", "Submit") use high-contrast styling, while secondary actions use subdued or outline styles.
3. **State Indication:** Always add visual feedback for asynchronous actions. Replace basic text with skeleton loaders for initial page loads, and add inline loading spinners to buttons during API calls.
4. **Micro-interactions:** Ensure all interactive elements (buttons, table rows, links) have clear `:hover`, `:focus`, and `:active` CSS states to improve tactile feedback.
5. **Accessibility (a11y):** Verify that all form inputs have associated `<label>` tags and required ARIA attributes.

## Constraints
- Do NOT alter the underlying business logic, API endpoints, or data mutation payloads.
- Do NOT remove existing `data-testid` attributes used for our automated testing.
- Do NOT use native browser `alert()` or `confirm()` dialogs; always use our custom `<Modal>` component.
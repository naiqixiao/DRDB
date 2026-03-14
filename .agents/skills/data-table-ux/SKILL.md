---
name: data-table-ux
description: Use this skill specifically when updating, refactoring, or creating data tables, lists, or CRUD interfaces in the VueJS application.
---

## Goal
Implement modern, user-friendly data tables with advanced UX features like empty states, responsive layouts, and safe destructive actions.

## Instructions
1. **Empty States:** If a data array is empty, never just show a blank table. Always implement a visually distinct "Empty State" block that includes a relevant icon, a helpful text explanation, and a Call-to-Action button (e.g., "Create your first record").
2. **Density and Readability:** Ensure table rows have adequate padding. Align numerical data to the right and text data to the left to improve scannability.
3. **Filtering and Pagination:** Place search and filter controls clearly above the data table. Ensure pagination controls are pinned to the bottom of the table view.
4. **Responsive Layouts:** Tables are terrible on mobile. Instruct the UI to hide non-essential columns on smaller viewports (`< 768px`) or stack the rows into individual card components.
5. **Destructive Actions:** Any "Delete" action in a row must be tucked behind a secondary menu (e.g., a three-dot dropdown) to prevent accidental clicks.

## Constraints
- Do NOT load the entire dataset into the client browser at once; always preserve server-side pagination logic.
- Do NOT wrap the entire table in a loading spinner; use row-based skeleton loaders when fetching next pages.
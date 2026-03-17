### Release V3.0.0 (Major UI & Platform Upgrade)

Welcome to the all-new DRDB! We've completely rebuilt the application from the ground up using Vue 3 and a modern, professional design system. 

#### 🎨 Design & User Experience
* **Professional UI Overhaul:** Every page has been redesigned with a clean, cohesive visual language (the `ds-card` system) for a premium, lightweight feel.
* **Modernized Navigation:** Larger, clearer sidebar menus and refined, sticky headers across major views.
* **Micro-Interactions:** Added smooth hover effects, shadow transitions, and improved button feedback across the entire application interface.
* **Responsive Layouts:** Improved spacing, typography, and contrast on all screen sizes.

#### 👥 Personnel & Team Management
* **Role-Based Visuals:** Team members and assigned experimenters now have distinct, color-coded badges (e.g., Red for Admin, Green for Grad Students, Pink for Undergrads) for instant recognition.
* **Smart Sorting:** The personnel directory is now automatically sorted by lab hierarchy (Admin > PI > Manager > PostDoc > Students > Staff).
* **Profile Defaulting:** Your own personal profile is now instantly selected when opening the Team Directory.
* **Assigned Studies Overhaul:** Study assignment cards now feature direct shortcuts to the Study Management page and properly format child age ranges.

#### 📅 Scheduling & Logistics
* **Streamlined Calendars:** Extracted complex scheduling logic into a dedicated service layer, improving performance and reliability when syncing with Google Calendar.
* **Timeline Refresh:** Refreshed the family timeline cards and medical condition chips for easier scanning.
* **Quick-Copy Contacts:** Added one-click copy buttons for participant emails and phone numbers on the Schedule page.
* **Upcoming Appointments:** Added a dedicated dashboard widget to instantly see the next three upcoming study appointments.

#### 🧪 Study Management
* **Enhanced Analytics Views:** Refined the display of recruitment metrics, drop-off rates, and experimenter workload charts.
* **Smarter Dialogs:** Upgraded all creation and assignment dialogs—including "Assign Experimenters"—to use consistent gradient headers, prominent action buttons, and clear typography.

#### ⚙️ Technical Improvements
* **Vue 3 Migration:** Upgraded the core framework to Vue 3 (Composition API) and Vite for lightning-fast loading speeds and better long-term maintainability.
* **Backend Refactoring:** Moved scheduling and chron-jobs into dedicated service modules, significantly improving code organization and testability.
* **API Documentation:** Integrated Swagger documentation across multiple backend routes.

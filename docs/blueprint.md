# **App Name**: ServerSphere

## Core Features:

- Secure User Authentication: Enable user registration and login with email/password, ensuring protected access to dashboard routes.
- VPS Overview Dashboard: A modern UI to display real-time storage, CPU, and RAM usage, hosted project count, and current subscription plan.
- Project Management Interface: List all hosted projects with essential details (name, domain, status, storage) and allow actions like start, stop, or delete, plus creating new projects.
- Streamlined Project Deployment: An intuitive modal for defining new projects by specifying name, domain, and selecting a hosting plan.
- Billing & Subscription Control: View current plan, estimated monthly costs based on usage, and options to manage subscriptions (upgrade/cancel).
- AI Performance Assistant: A generative AI tool to analyze server usage patterns (from usage and projects collections) and provide personalized recommendations for optimizing resource allocation and cost efficiency.
- Data Isolation & Route Protection: Guarantee that users only access their own project data and secure all authenticated routes from unauthorized access.

## Style Guidelines:

- The chosen visual theme is dark mode by default, creating a sleek and professional atmosphere. The primary interactive color, reminiscent of modern tech interfaces, is a deep yet clear blue (#4F93F7). This color is dynamic and provides excellent contrast against the dark background. The background itself is a heavily desaturated deep blue-gray (#191C1E), offering a subtle connection to the primary hue while maintaining a minimalist and focused environment. For key highlights and alerts, a vibrant cyan (#55DAF8) is used as an accent, ensuring important elements stand out clearly without being overly aggressive.
- All text uses 'Inter', a grotesque-style sans-serif font. Its modern, machined, and neutral aesthetic is perfectly suited for conveying information clearly and objectively, from dashboard metrics to project details, while maintaining a clean and minimalist look across the entire application.
- Clean and modern system-style icons will be utilized throughout the interface, adhering to a consistent stroke weight. Icons will feature filled states for active functions and outlines for inactive or default representations, ensuring intuitive user recognition and visual consistency with the minimalist aesthetic.
- A responsive two-column layout dominates the authenticated experience, featuring a prominent sidebar for navigation and a top bar for user controls. Content areas, such as project listings and data visualizations, are presented in card components with large rounded corners (xl) and soft, subtle shadows, aligning with the modern, minimalist design. Charts will be integral for visualizing resource usage efficiently.
- Subtle, smooth hover effects will enhance interactive elements, providing clear feedback without distracting from the core functionality. Transition animations for state changes, such as loading data into charts or altering project statuses, will be smooth and unobtrusive, contributing to a refined user experience.
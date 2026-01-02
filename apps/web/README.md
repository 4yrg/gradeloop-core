# Production-Ready Next.js Folder Structure

This document outlines a production-ready folder structure for a Next.js (App Router) client application designed to consume multiple backend microservices. The structure is feature-driven, promoting scalability, team collaboration, and a clear separation of concerns.

## Tech Stack

*   **Framework:** Next.js (App Router, TypeScript)
*   **Server/Async State:** TanStack Query
*   **Client/UI State:** Zustand
*   **Schemas & Validation:** Zod
*   **UI Components:** shadcn/ui

## Root Directory

- **`.next/`**: Next.js build output.
- **`node_modules/`**: Project dependencies.
- **`public/`**: Static assets (images, fonts, etc.).
- **`...config files`**: `next.config.ts`, `tsconfig.json`, `package.json`, etc.

## Folder Structure

### `app/`

The `app` directory contains all routing, following Next.js's App Router conventions.

- **`app/(auth)/`**: Route group for authentication-related pages (e.g., login, register). These routes typically have a different layout than the main application.
- **`app/(main)/`**: Route group for the main application pages after a user is authenticated (e.g., dashboard, orders, users). This group has its own layout (`app/(main)/layout.tsx`) which often includes a sidebar, header, etc.
- **`app/api/`**: Next.js API routes (Route Handlers). Can be used for backend-for-frontend (BFF) patterns, like proxying requests to microservices.
- **`app/layout.tsx`**: The root layout of the application.
- **`app/page.tsx`**: The landing page of the application.
- **`app/global.d.ts`**: Global TypeScript declarations.

### `components/`

Contains reusable React components, organized by their function.

- **`components/layouts/`**: Major layout components (e.g., `DashboardLayout`, `RootLayout`).
- **`components/shared/`**: Components shared across multiple features (e.g., `Header`, `Sidebar`, `Avatar`).
- **`components/ui/`**: UI primitives, typically from a library like **shadcn/ui** (e.g., `Button`, `Input`, `Card`).

### `constants/`

Application-wide constants.

- **`constants/config.ts`**: Global configuration and environment variables.
- **`constants/routes.ts`**: Application routes and paths.

### `features/`

The core of the domain-driven structure. Each folder inside `features` represents a distinct domain or feature of the application. This co-locates all the logic related to a specific feature, making the codebase easier to navigate and maintain.

- **`features/[featureName]/`**: A folder for a specific feature (e.g., `auth`, `users`, `orders`).
  - **`api/`**: TanStack Query hooks (`useQuery`, `useMutation`) for fetching and updating data.
  - **`components/`**: React components that are specific to this feature.
  - **`hooks/`**: Feature-specific React hooks.
  - **`schemas/`**: Zod schemas for validating data structures related to the feature.
  - **`store/`**: Zustand store for managing local state for the feature.
  - **`types/`**: TypeScript types specific to the feature.

### `hooks/`

Contains generic, reusable React hooks that are not specific to any feature (e.g., `useDebounce`, `useLocalStorage`).

### `lib/`

Shared libraries, helpers, and utilities.

- **`lib/api/`**: TanStack Query client setup and configuration.
- **`lib/schemas/`**: Global or shared Zod schemas.
- **`lib/utils.ts`**: General utility functions (e.g., `cn` for classnames).

### `providers/`

React Context providers for wrapping the application with global state or functionality.

- **`providers/QueryProvider.tsx`**: TanStack Query provider.
- **`providers/ThemeProvider.tsx`**: Theme provider for UI libraries.

### `services/`

Handles the actual communication with backend microservices. This layer abstracts the API calls, making it easy to manage different microservices and their endpoints.

- **`services/api-gateway/`**: A client for an API gateway, if one is used.
- **`services/[serviceName]Service.ts`**: A dedicated service for each microservice (e.g., `authService.ts`, `ordersService.ts`). Each service exports functions that make API requests.

### `store/`

Global Zustand stores for UI state that is shared across multiple features.

- **`store/ui.store.ts`**: A store for managing global UI state, such as modals, notifications, or sidebar visibility.

### `types/`

Global TypeScript types and interfaces that are used across the application.

- **`types/api.ts`**: Types for API request and response payloads.
- **`types/generics.ts`**: Generic utility types.
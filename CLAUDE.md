# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture and Structure

This project is a Node.js/Express/TypeScript application acting as a journal publication server (UBJH server). It follows a modular structure with the `src` directory as the core, containing specialized subdirectories:

*   **`Articles/`**: Manages all article-related logic.
*   **`authors/`**: Handles functionalities specific to authors.
*   **`config/`**: Stores application configuration settings.
*   **`controllers/`**: Contains Express.js controllers for processing API requests.
*   **`db/`**: Manages database connections and defines database models.
*   **`middleware/`**: Houses Express.js middleware functions.
*   **`model/`**: Defines the database schemas.
*   **`Publication/`**: Manages publication-specific logic.
*   **`Review_System/`**: Contains the functionality for the review process.
*   **`Reviewers/`**: Handles reviewer-specific logic.
*   **`routes/`**: Defines the application's API endpoints.
*   **`scripts/`**: Includes utility scripts (e.g., `createAdmin.ts`).
*   **`services/`**: Encapsulates core business logic, separate from controllers.
*   **`templates/`**: Stores templates, potentially for emails or rendered content.
*   **`uploads/`**: Designated for storing file uploads.
*   **`utils/`**: Contains general utility functions.
*   **`app.ts`**: Sets up the main Express application.
*   **`index.ts`**: Serves as the primary entry point for the application.
*   **`worker.ts`**: The entry point for any worker processes.

## Common Development Tasks

*   **Build**:
    *   `npm run build`: Compiles TypeScript code using `tsc`.
*   **Lint**:
    *   `npm run lint`: Executes ESLint to check for code quality issues.
    *   `npm run lint:fix`: Runs ESLint and attempts to automatically fix issues.
*   **Run Application**:
    *   `npm start`: Initiates the compiled application (`dist/index.js`).
    *   `npm run dev`: Starts a development server with `nodemon` and `ts-node` for live reloading.
*   **Run Worker**:
    *   `npm run worker`: Executes the application's worker process.
*   **Seed Admin**:
    *   `npm run seed:admin`: Runs a script to create an administrator user.
*   **Clean Build**:
    *   `npm run clean`: Deletes the `dist` directory (compiled output).

## Running Tests

No explicit test scripts or common test file patterns were identified in the `package.json` or codebase. Automated testing might not be implemented or uses a non-standard setup. Future development efforts could consider establishing a testing framework.

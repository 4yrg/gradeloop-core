## Git Branching Strategy

This project follows a structured, hierarchical branching model based on GitFlow. The flow is designed to organize development from large features (Epics) down to individual tasks, ensuring code quality through a multi-stage review process.

---
### Main Branches

These are the two primary, long-lived branches in the repository.

* **`main`**: This branch represents the stable, production-ready code. Code is only merged into `main` from `develop` periodically (e.g., for a release).
* **`develop`**: This is the primary integration branch where all completed epics are merged. It serves as the single source of truth for the current state of development.

---
### Development Branch Hierarchy

Development work is organized into three levels of feature branches: **Epics**, **User Stories**, and **Tasks**.

#### 1. Epic Branches
* **Purpose**: To manage a large feature or body of work that consists of multiple user stories.
* **Created From**: `develop`
* **Naming Convention**: `{username}/{ticket#}-epic-{description}`
* **Example**: `dasunwickr/4yr2-8-epic-semantic-code-evaluation`

#### 2. User Story Branches
* **Purpose**: To develop a specific feature or user story that is part of a larger epic.
* **Created From**: The parent **Epic branch**.
* **Naming Convention**: `{username}/{ticket#}-user-story-{description}`
* **Example**: `dasunwickr/4yr2-9-user-story-implement-codebert-model`

#### 3. Task Branches
* **Purpose**: To work on a small, specific, and well-defined task that is part of a user story. This is the branch where individual developers write code.
* **Created From**: The parent **User Story branch**.
* **Naming Convention**: `{username}/{ticket#}-task-{description}`
* **Example**: `dasunwickr/4yr2-10-task-create-api-endpoint`

---
### Workflow and Merge Process

The workflow follows a "merge backward" or "merge up" pattern, starting from the most specific task and integrating back into the main `develop` branch. **All merges must be done via Pull Requests (PRs).**



#### **Step 1: Task Development**
1.  A developer creates a **Task branch** from its parent **User Story branch**.
2.  The developer completes the work on the Task branch, making commits.
3.  Once finished, the developer creates a PR to merge the **Task branch** back into the **User Story branch**. A peer review is recommended at this stage.

#### **Step 2: User Story Integration**
1.  After all its associated Task branches have been merged, the **User Story branch** is now feature-complete.
2.  A PR is created to merge the **User Story branch** into its parent **Epic branch**.

#### **Step 3: Epic Integration**
1.  Once all its associated User Story branches have been merged, the **Epic branch** contains the complete, large-scale feature.
2.  A PR is created to merge the **Epic branch** into the **`develop` branch**.
3.  **A peer review from at least one other developer is required before this merge can be completed.**

#### **Step 4: Release to Main**
1.  Periodically (e.g., at the end of a sprint or milestone), a release is prepared by creating a PR to merge the **`develop` branch** into the **`main` branch**.
2.  **A peer review from two other developers is required before this merge can be completed.** This ensures maximum stability for the `main` branch.
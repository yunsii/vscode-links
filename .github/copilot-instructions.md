# VS Code Links Extension - AI Coding Guidelines

## Project Overview

This is a VS Code extension for managing project-related links with support for local/remote resources, auto-detection from git repos (GitHub, CODING, CNB), and template variable injection.

## General Guidelines

- **Solution Approach First**: Unless directly instructed to generate code, always prioritize providing an intuitive and clear solution approach before implementing changes. This includes:
  - Breaking down the problem into logical steps
  - Explaining the reasoning behind the proposed solution
  - Considering alternative approaches when applicable
  - Highlighting potential impacts or considerations
- **Code Generation**: Only proceed with code generation when explicitly requested or when the solution approach has been approved and detailed implementation is needed.

## Project Structure

The project follows a modular structure:

- `src/`: Main source code
  - `index.ts`: Extension entry point
  - `utils.ts`: Utility functions
  - `commands/`: Command handlers organized by type (e.g., `open/github/`, `open/coding/`)
  - `constants/`: Constant definitions and generated metadata
  - `helpers/`: Utility modules for config, CSV, errors, git, icons, etc.
  - `status-bar-item/`: Status bar integration
  - `store/`: State management for links
  - `template/`: Template engine with providers for variable substitution
  - `views-containers/`: Tree view provider and item definitions
- `test/`: Unit tests
- `docs/`: Documentation files (e.g., variables.md)
- `res/`: Resources like icons
- Configuration files: `eslint.config.ts`, `vitest.config.ts`, `tsconfig.json`, etc.

## Architecture

- **Framework**: Built with `reactive-vscode` for reactive extension development
- **Entry Point**: `src/index.ts` uses `defineExtension()` wrapper
- **Core Flow**: Configuration → `getAllLinkResources()` → Categorization → Tree View Provider
- **Key Components**:
  - `src/commands/`: Command handlers (e.g., `links.open` quick pick)
  - `src/views-containers/`: Tree view with `LinksProvider` and categorized resources
  - `src/helpers/`: Config management, caching, icons, URL processing
  - `src/template/`: Variable substitution engine with provider pattern
  - `src/store/`: Centralized state for link resources
  - `src/status-bar-item/`: Status bar item for quick access
  - `src/constants/`: Shared constants and metadata

## Key Patterns

- **Reactive Config**: Use `defineConfigObject()` from reactive-vscode for settings
- **Caching**: In-memory cache in `getAllLinkResources()` with auto-clear on config/workspace changes
- **Resource Types**: `BaseLinkResource` with types: 'local', 'detected', 'remote-project', 'remote-shared'
- **Template Rendering**: `buildContext()` collects workspace/repo data, `renderResource()` applies variables
- **Error Handling**: Centralized in `getErrorMessage()`, with provider-specific error callbacks
- **Icons**: Customizable via `links.customIcons` config, defaults in `getIconForType()`

## Development Workflow

- **Build**: `pnpm run build` (tsup bundles to `dist/`) - Run only when preparing for release or testing the bundled extension
- **Dev**: `pnpm run dev` (watch mode) - Use for development with hot reload
- **Test**: `pnpm run test` (vitest watch mode) or `npx vitest --run` for single run
- **Lint**: `pnpm run lint` (ESLint with auto-fix)
- **Type Check**: `pnpm run typecheck` (TypeScript compilation check)
- **Publish**: `pnpm run release` (bumpp version + publish)

### Code Change Validation

- **Untested code changes**: Run `pnpm run typecheck` only for type safety - no build needed
- **Tested code changes**: Run `npx vitest --run` to validate functionality (add file path for specific tests)
- **Pre-commit**: Husky runs lint-staged on all files (includes linting)

## Testing

- Tests are located in `test/` and alongside source files (e.g., `*.test.ts`)
- Use Vitest for unit testing
- Run specific tests: `npx vitest --run path/to/test.file`
- Coverage and integration tests should be added as needed

## Conventions

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json and vitest.config.ts)
- **Imports**: Prefer absolute paths with `@/` alias
- **Reactive API**: Use `useCommands()`, `ref()`, `useVscodeContext()` from reactive-vscode
- **Async Patterns**: Promise deduplication in caching, error swallowing in template providers
- **File Structure**: Commands in subdirs by type (e.g., `commands/open/github/`), helpers grouped by function

## Examples

- **Adding Command**: Use `useCommands()` in `setupViewsAndCommands()` (see `src/views-containers/index.ts`)
- **Config Access**: `config.resources` for user settings (see `src/helpers/config.ts`)
- **Tree Items**: Extend `vscode.TreeItem` with custom properties (see `src/views-containers/items.ts`)
- **Template Variables**: Register providers in `src/template/engine.ts` for custom context fragments

## Integration Points

- **VS Code APIs**: Tree Data Provider, Status Bar, Quick Pick, Configuration
- **External Services**: Git repo detection, remote CSV fetching via axios
- **Dependencies**: reactive-vscode for reactivity, papaparse for CSV, simple-git for repo info

## Documentation

- User documentation: `README.md`, `README.zh.md`
- Variable documentation: `docs/variables.md`, `docs/variables.zh.md`
- Keep documentation up-to-date with code changes

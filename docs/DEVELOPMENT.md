# Development Guide

This guide covers everything you need to know about developing, testing, and contributing to the GraphQL Federation Schema Parser project.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Debugging](#debugging)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- Bun >= 1.0.0 (recommended) or npm/pnpm
- Git

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tiagoboeing/graphql-federation-schema-parser.git
   cd graphql-federation-schema-parser
   ```

2. **Install dependencies:**
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using bun
   bun install
   
   # Or using npm
   npm install
   ```

3. **Verify installation:**
   ```bash
   pnpm start:dev-ts --help
   ```

## Project Structure

```
graphql-federation-schema-parser/
├── src/                          # Source code
│   ├── index.ts                  # CLI entry point
│   ├── commands/                 # Command implementations
│   │   └── parse/                # Parse command
│   │       ├── parse.command.ts  # Main parse logic
│   │       └── parse.model.ts    # Type definitions
│   └── utils/                    # Utility functions
│       ├── graphql-parse.utils.ts    # GraphQL parsing utilities
│       ├── logger.utils.ts           # Logging configuration
│       └── read-schema-files.utils.ts # File system utilities
├── schemas/                      # Example schema files
├── docs/                         # Documentation
├── dist/                         # Build output
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

### Key Files

- **`src/index.ts`**: CLI entry point using Commander.js
- **`src/commands/parse/parse.command.ts`**: Core parsing logic
- **`src/utils/graphql-parse.utils.ts`**: GraphQL schema transformation utilities
- **`src/utils/read-schema-files.utils.ts`**: File system operations
- **`src/utils/logger.utils.ts`**: Logging configuration

## Development Workflow

### Running in Development Mode

#### Using TypeScript with tsx (Recommended for debugging)

```bash
# Watch mode with TypeScript
pnpm start:dev-ts

# With arguments
pnpm start:dev-ts parse -d ./schemas -s users -n platform

# With debug output
pnpm start:dev-ts parse -d ./schemas -s users -n platform -D
```

#### Using Bun (Faster but limited debugging)

```bash
# Watch mode with Bun
pnpm start:dev

# With arguments
pnpm start:dev parse -d ./schemas -s users -n platform

# Direct bun execution
bun --watch src/index.ts parse -d ./schemas -s users -n platform
```

### Debugging

#### VS Code Debugging

1. **JavaScript Debug Terminal**: Open a JavaScript Debug Terminal in VS Code
2. **Run with tsx**: Use `pnpm start:dev-ts` commands in the debug terminal
3. **Set breakpoints**: Add breakpoints in your TypeScript files
4. **Debug**: The debugger will automatically attach

#### Manual Debugging

```bash
# Start with inspect flag
pnpm start:debug

# Then connect your debugger to the inspect port
```

### Making changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Edit source files in `src/`
   - Update documentation if needed
   - Add tests if applicable

3. **Test your changes:**
   ```bash
   # Test with example schemas
   pnpm start:dev-ts parse -d ./schemas -s users -n platform
   
   # Test with debug output
   pnpm start:dev-ts parse -d ./schemas -s users -n platform -D
   ```

4. **Build and verify:**
   ```bash
   pnpm build
   ./dist/index.js parse -d ./schemas -s users -n platform

   # Test binary
   pnpm build:executable
   ./dist/gql-federation-schema-parser parse -d ./schemas -s users -n platform
   ```

## Testing

### Manual Testing

Use the example schemas in the `schemas/` directory:

```bash
# Basic test
pnpm start:dev-ts parse -d ./schemas -s users -n platform

# Test with output file
pnpm start:dev-ts parse -d ./schemas -s users -n platform --write-to-file

# Test with custom output file
pnpm start:dev-ts parse -d ./schemas -s users -n platform --write-to-file -o custom-schema.graphql
```

### Test Cases to Verify

1. **Single file parsing:**
   ```bash
   pnpm start:dev-ts parse -d ./schemas/users.graphql -s users -n platform
   ```

2. **Directory parsing:**
   ```bash
   pnpm start:dev-ts parse -d ./schemas -s users -n platform
   ```

3. **Subdirectory parsing:**
   ```bash
   pnpm start:dev-ts parse -d ./schemas/subfolder -s sub -n platform
   ```

4. **Error handling:**
   ```bash
   # Non-existent directory
   pnpm start:dev-ts parse -d ./nonexistent -s users -n platform
   
   # Invalid GraphQL syntax (modify a schema file temporarily)
   ```

### Schema Validation

Verify that the generated schema:
- Has proper type prefixing
- Maintains GraphQL syntax validity
- Preserves directives
- Handles nested types correctly

## Building

### Development Build

```bash
# Build with Bun (faster)
pnpm build

# Output will be in ./dist/index.js
```

### Production Build

The CI/CD pipeline automatically builds the project on every commit or release.

## Contributing

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Documentation Contributions

- Update README.md for user-facing changes
- Update API.md for internal API changes
- Add examples for new features
- Fix typos and improve clarity

### Bug Reports

Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)
- Sample schema files if relevant

### Feature Requests

Include:
- Use case description
- Proposed solution
- Examples of desired behavior
- Backward compatibility considerations

## IDE Configuration

### VS Code

Recommended extensions:
- TypeScript and JavaScript Language Features
- GraphQL Language Feature Support
- Prettier - Code formatter

### Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Security Considerations

- **File System Access**: Only reads files with `.graphql` extensions
- **Input Validation**: Validates directory paths and file existence
- **No Network Access**: Operates entirely on local files
- **No Code Execution**: Only parses and transforms GraphQL schemas

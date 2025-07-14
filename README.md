# GraphQL Federation Schema Parser

![GitHub Release](https://img.shields.io/github/v/release/tiagoboeing/graphql-federation-schema-parser)
[![NPM Version](https://img.shields.io/npm/v/%40tiagoboeing%2Fgql-federation-schema-parser)](https://www.npmjs.com/package/@tiagoboeing/gql-federation-schema-parser)

![](./docs/terminal.png)

This project provides a CLI tool to parse GraphQL schemas and generate TypeScript definitions for use in a GraphQL Federation gateway.

Run it on a directory containing GraphQL schema files, and it will output TypeScript definitions to publish to Schema Registry. All schema files will be parsed and merged into a single schema scoped by a provided namespace and service name.

For what purpose should you use this tool?
- Building a **GraphQL supergraph**: Use it to create a federated schema for a GraphQL gateway, allowing you to combine multiple services into a single schema and namespace them properly.

| Feature                  | Description                                                       | Supported |
| ------------------------ | ----------------------------------------------------------------- | --------- |
| Recursive schema parsing | Parses all `.graphql` files in a directory and its subdirectories | ✅         |

## Usage

### Commands

- `parse`: Parses GraphQL schema files and generates TypeScript definitions.
- `help`: Displays help information for the CLI tool.

To get help on the CLI, run `--help` or `-h` on any command:

```bash
gql-federation-schema-parser --help
# or
gql-federation-schema-parser -h

# On a specific command
gql-federation-schema-parser parse --help
# or
gql-federation-schema-parser parse -h
```

### Debug mode

You can enable debug mode to see detailed logs of the parsing process. This is useful for troubleshooting issues with schema files or understanding how the tool works.

Use `-D` or `--debug` on any command to enable global debug mode:

```bash
gql-federation-schema-parser parse -d ./schemas -s myService -n myScope -D
# or
gql-federation-schema-parser parse -d ./schemas -s myService -n myScope --debug
```

> [!NOTE]
>
> Debug mode is a global setting and will apply to all commands. It will log detailed information about the parsing process, including file paths, and other relevant information.

## How it works

With the following [schema files](./schemas) in a directory and these settings:

- `--service-name`: `myService`
- `--namespace`: `myScope`

The resulting GraphQL schema will be:

```graphql
# Graphql root definitions
type Query {
  myScope: NamespaceQueries!
}

type Mutation {
  myScope: NamespaceMutations!
}

type Subscription {
  myScope: NamespaceSubscriptions!
}

# Namespace operations
type NamespaceMutations {
  myService: myServiceMutations!
}

type NamespaceQueries {
  myService: myServiceQueries!
}

type NamespaceSubscriptions {
  myService: myServiceSubscriptions!
}

# Service definitions
type myServiceQueries {
  ...
}

type myServiceMutations {
  ...
}

type ScopeSubscriptions {
  ...
}
```

In gateway you can query the schema like this:

```graphql
query {
  myNamespace {
    myService {
      # Query, mutate or subscribe to your service operations
      ...
    }
  }
}
```

## Installation

You can install the `gql-federation-schema-parser` CLI tool using one of the following methods:

- Using NPM
- On any platform with the pre-built binary

### Using NPM

To install the CLI tool globally using NPM, run:

```bash
npm install -g @tiagoboeing/gql-federation-schema-parser
# or
pnpm install -g @tiagoboeing/gql-federation-schema-parser
```

After install, run:

```bash
gql-federation-schema-parser --help
```

### Pre-built Binary

#### MacOS

On MacOS a warn will be shown when running the binary for the first time, indicating that it is from an unidentified developer. You can bypass this by following these steps:

```bash
# Download the latest release from the release page and unzip it
...

# Trust the binary and make it executable
xattr -d com.apple.quarantine gql-federation-schema-parser-macos
chmod +x gql-federation-schema-parser-macos

# Run the binary
./gql-federation-schema-parser-macos --help
```

#### Linux

On Linux, you can download the pre-built binary from the release page and run it directly:

```bash
# Download the latest release from the release page and unzip it
...
chmod +x gql-federation-schema-parser-macos

# Run the binary
./gql-federation-schema-parser-macos --help
```

## Development

To develop this project, you will need Node.js and npm installed. Follow these steps to set up the development environment:

### Testing CLI

To test the CLI, you can use `ts-node-dev` to run the TypeScript code directly:

```bash
npx ts-node-dev src/index.ts [args]

# Example:
npx ts-node-dev src/index.ts --help
```

or you can use `bun` to run the TypeScript code:

```bash
pnpm start:dev 
# or
bun --watch src/index.ts

# Pass arguments to the script
pnpm start:dev ...args
# Example:
pnpm start:dev parse -d ./schemas -s users -n platform
```
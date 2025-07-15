# API Documentation

This document provides detailed information about the GraphQL Federation Schema Parser's internal API and architecture.

## Table of Contents

- [Core Functions](#core-functions)
- [Utility Functions](#utility-functions)
- [Command Interface](#command-interface)
- [Type System](#type-system)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Core Functions

### `generateTypeDefinition(type, prefix: string)`

Generates a GraphQL type definition string with proper prefixing and formatting.

**Parameters:**
- `type`: GraphQL type object (GraphQLObjectType, GraphQLScalarType, etc.)
- `prefix`: String prefix to apply to non-primitive types

**Returns:** Formatted GraphQL type definition string

**Supported Types:**
- `GraphQLScalarType`: Returns scalar definition
- `GraphQLEnumType`: Returns enum definition with values
- `GraphQLInterfaceType`: Returns interface definition with fields
- `GraphQLUnionType`: Returns union definition with member types
- `GraphQLInputObjectType`: Returns input object definition
- `GraphQLObjectType`: Returns object type definition with fields

**Example:**
```typescript
const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString }
  }
});

const result = generateTypeDefinition(userType, 'PlatformUsers__');
// Output: "type PlatformUsers__User {\n  id: ID!\n  name: String\n}"
```

### `transformTypeName(typeStr, prefix: string)`

Transforms GraphQL type names by adding prefixes to non-primitive types.

**Parameters:**
- `typeStr`: GraphQL type string (e.g., "String!", "[User!]!")
- `prefix`: Prefix to add to custom types

**Returns:** Transformed type string

**Primitive Types (unchanged):**
- `String`, `Int`, `Float`, `Boolean`, `ID`
- `DateTime`, `JSON`, `JSONObject`, `BigInt`

**Example:**
```typescript
transformTypeName("String!", "MyService__") // → "String!"
transformTypeName("User!", "MyService__")   // → "MyService__User!"
transformTypeName("[Post!]!", "MyService__") // → "[MyService__Post!]!"
```

### `generateFieldDefinition(field, prefix: string)`

Generates GraphQL field definitions with arguments, types, and directives.

**Parameters:**
- `field`: GraphQL field object with name, type, args, and astNode
- `prefix`: Prefix for non-primitive types

**Returns:** Formatted field definition string

**Features:**
- Handles field arguments with default values
- Preserves GraphQL directives
- Transforms custom types with prefixes
- Supports complex nested types

**Example:**
```typescript
const field = {
  name: 'user',
  type: 'User',
  args: [
    { name: 'id', type: 'ID!' },
    { name: 'includeProfile', type: 'Boolean', defaultValue: false }
  ]
};

generateFieldDefinition(field, 'MyService__');
// Output: "user(id: ID!, includeProfile: Boolean = false): MyService__User"
```

## Utility Functions

### `readFiles(files: string[])`

Reads multiple schema files synchronously.

**Parameters:**
- `files`: Array of absolute file paths

**Returns:** Array of file contents as strings

**Error Handling:** Returns empty array on error and logs to console

### `findSchemaFiles(directory: string, logger: ConsolaInstance)`

Recursively finds GraphQL schema files in a directory.

**Parameters:**
- `directory`: Directory path to search or file path to validate
- `logger`: Consola logger instance

**Returns:** Array of absolute paths to .graphql files

**Behavior:**
- Handles both files and directories
- Recursively searches subdirectories
- Validates .graphql file extensions
- Provides detailed logging

### `appLogger(logLevel?, useColors?)`

Creates a configured Consola logger instance.

**Parameters:**
- `logLevel`: Minimum log level (default: ConsolaLogLevel.Info)
- `useColors`: Enable colored output (default: auto-detected)

**Returns:** Configured Consola logger instance

## Type System

### Prefix Generation

The tool generates type prefixes using the following pattern:
```
{CapitalizedNamespace}{CapitalizedServiceName}__
```

**Example:**
- Namespace: `platform`
- Service: `users`
- Prefix: `PlatformUsers__`

### Schema Structure

Generated schemas follow this hierarchy:
```
Query
└── {namespace}
    └── {serviceName}
        └── {operations}

Mutation
└── {namespace}
    └── {serviceName}
        └── {operations}

{Namespace}{ServiceName}__{TypeName}
```

## Error Handling

### Common Error Scenarios

1. **File System Errors**
   - Directory not found
   - Permission denied
   - Invalid file format

2. **Schema Validation Errors**
   - Invalid GraphQL syntax
   - Missing required fields
   - Type conflicts

3. **Configuration Errors**
   - Missing required parameters
   - Invalid service/namespace names

### Error Recovery

The tool implements graceful error handling:
- Logs detailed error messages
- Continues processing when possible
- Returns empty results for failed operations
- Provides helpful debugging information

## Examples

### Basic Usage

```typescript
import { generateTypeDefinition, transformTypeName } from './utils/graphql-parse.utils';

// Transform a simple type
const transformed = transformTypeName('User!', 'MyApp__');
console.log(transformed); // "MyApp__User!"

// Generate type definition
const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    email: { type: GraphQLString }
  }
});

const definition = generateTypeDefinition(userType, 'MyApp__');
console.log(definition);
// Output:
// type MyApp__User {
//   id: ID!
//   email: String
// }
```

### Advanced Field Generation

```typescript
const complexField = {
  name: 'searchUsers',
  type: '[User!]!',
  args: [
    { name: 'query', type: 'String!', defaultValue: undefined },
    { name: 'limit', type: 'Int', defaultValue: 10 },
    { name: 'sortBy', type: 'UserSortInput', defaultValue: undefined }
  ],
  astNode: {
    directives: [
      { name: 'auth', arguments: [{ name: 'requires', value: 'USER' }] }
    ]
  }
};

const fieldDef = generateFieldDefinition(complexField, 'MyApp__');
console.log(fieldDef);
// Output: "searchUsers(query: String!, limit: Int = 10, sortBy: MyApp__UserSortInput): [MyApp__User!]! @auth(requires: USER)"
```

### Federation Gateway Usage

Generated schemas are designed for use with GraphQL Federation gateways:

1. **Schema Registry Publishing**: Use the output to publish to your schema registry
2. **Gateway Integration**: Configure your gateway to route namespaced queries to services
3. **Type Resolution**: Implement custom resolvers for prefixed types

### Custom Directives

The tool preserves custom directives from the original schema:

```graphql
type User @key(fields: "id") {
  id: ID!
  name: String @deprecated(reason: "Use fullName instead")
}
```

These directives are maintained in the generated output for federation compatibility.

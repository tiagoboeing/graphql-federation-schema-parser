# Examples Guide

This guide provides practical examples of using the GraphQL Federation Schema Parser in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Schema Transformations](#advanced-schema-transformations)
- [Federation Patterns](#federation-patterns)
- [CLI Examples](#cli-examples)
- [Integration Examples](#integration-examples)
- [Troubleshooting Examples](#troubleshooting-examples)

## Basic Usage

### Simple Schema Parsing

Given a basic schema file `users.graphql`:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}
```

**Command:**
```bash
gql-federation-schema-parser parse -d ./schemas -s users -n platform
```

**Output:**
```graphql
type PlatformUsers__User {
  id: ID!
  name: String!
  email: String!
}

type PlatformUsersQueries {
  user(id: ID!): PlatformUsers__User
  users: [PlatformUsers__User!]!
}

type PlatformQueries {
  users: PlatformUsersQueries!
}

type Query {
  platform: PlatformQueries!
}
```

### Multiple Files

Directory structure:
```
schemas/
├── users.graphql
├── posts.graphql
└── comments.graphql
```

**users.graphql:**
```graphql
type User {
  id: ID!
  name: String!
}

type Query {
  user(id: ID!): User
}
```

**posts.graphql:**
```graphql
type Post {
  id: ID!
  title: String!
  authorId: ID!
}

type Query {
  post(id: ID!): Post
}
```

**Command:**
```bash
gql-federation-schema-parser parse -d ./schemas -s content -n platform
```

**Output:**
```graphql
type PlatformContent__User {
  id: ID!
  name: String!
}

type PlatformContent__Post {
  id: ID!
  title: String!
  authorId: ID!
}

type PlatformContentQueries {
  user(id: ID!): PlatformContent__User
  post(id: ID!): PlatformContent__Post
}

type PlatformQueries {
  content: PlatformContentQueries!
}

type Query {
  platform: PlatformQueries!
}
```

## Advanced Schema Transformations

### Enums and Scalars

**Input Schema:**
```graphql
scalar DateTime
scalar JSON

enum UserRole {
  ADMIN
  USER
  GUEST
}

type User {
  id: ID!
  role: UserRole!
  createdAt: DateTime!
  metadata: JSON
}
```

**Command:**
```bash
gql-federation-schema-parser parse -d ./schema.graphql -s users -n platform
```

**Output:**
```graphql
scalar DateTime
scalar JSON

enum PlatformUsers__UserRole {
  ADMIN
  USER
  GUEST
}

type PlatformUsers__User {
  id: ID!
  role: PlatformUsers__UserRole!
  createdAt: DateTime!
  metadata: JSON
}
```

### Interfaces and Unions

**Input Schema:**
```graphql
interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  name: String!
}

type Post implements Node {
  id: ID!
  title: String!
}

union SearchResult = User | Post

type Query {
  node(id: ID!): Node
  search(query: String!): [SearchResult!]!
}
```

**Output:**
```graphql
interface Node {
  id: ID!
}

type PlatformSearch__User implements Node {
  id: ID!
  name: String!
}

type PlatformSearch__Post implements Node {
  id: ID!
  title: String!
}

union PlatformSearch__SearchResult = PlatformSearch__User | PlatformSearch__Post

type PlatformSearchQueries {
  node(id: ID!): Node
  search(query: String!): [PlatformSearch__SearchResult!]!
}
```

### Input Objects and Mutations

**Input Schema:**
```graphql
input CreateUserInput {
  name: String!
  email: String!
  role: UserRole = USER
}

input UpdateUserInput {
  name: String
  email: String
  role: UserRole
}

type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
```

**Output:**
```graphql
input PlatformUsers__CreateUserInput {
  name: String!
  email: String!
  role: PlatformUsers__UserRole = USER
}

input PlatformUsers__UpdateUserInput {
  name: String
  email: String
  role: PlatformUsers__UserRole
}

type PlatformUsers__User {
  id: ID!
  name: String!
  email: String!
  role: PlatformUsers__UserRole!
}

type PlatformUsersMutations {
  createUser(input: PlatformUsers__CreateUserInput!): PlatformUsers__User!
  updateUser(id: ID!, input: PlatformUsers__UpdateUserInput!): PlatformUsers__User!
  deleteUser(id: ID!): Boolean!
}

type PlatformMutations {
  users: PlatformUsersMutations!
}

type Mutation {
  platform: PlatformMutations!
}
```

### Directives

**Input Schema:**
```graphql
directive @auth(requires: String!) on FIELD_DEFINITION

type User {
  id: ID!
  name: String!
  email: String! @auth(requires: "USER")
  adminNotes: String @auth(requires: "ADMIN")
}

type Query {
  user(id: ID!): User @auth(requires: "USER")
  users: [User!]! @auth(requires: "ADMIN")
}
```

**Output:**
```graphql
directive @auth(requires: String!) on FIELD_DEFINITION

type PlatformUsers__User {
  id: ID!
  name: String!
  email: String! @auth(requires: "USER")
  adminNotes: String @auth(requires: "ADMIN")
}

type PlatformUsersQueries {
  user(id: ID!): PlatformUsers__User @auth(requires: "USER")
  users: [PlatformUsers__User!]! @auth(requires: "ADMIN")
}
```

## Federation Patterns

### Microservice Schema

**Service: User Service**
```bash
gql-federation-schema-parser parse -d ./user-schemas -s users -n platform
```

**Service: Post Service**
```bash
gql-federation-schema-parser parse -d ./post-schemas -s posts -n platform
```

**Service: Comment Service**
```bash
gql-federation-schema-parser parse -d ./comment-schemas -s comments -n platform
```

**Gateway Query:**
```graphql
query {
  platform {
    users {
      user(id: "1") {
        id
        name
      }
    }
    posts {
      post(id: "1") {
        id
        title
      }
    }
    comments {
      comments(postId: "1") {
        id
        content
      }
    }
  }
}
```

### Multiple Namespaces

**E-commerce Platform:**
```bash
# User management
gql-federation-schema-parser parse -d ./user-schemas -s users -n auth

# Product catalog
gql-federation-schema-parser parse -d ./product-schemas -s products -n catalog

# Order processing
gql-federation-schema-parser parse -d ./order-schemas -s orders -n commerce
```

**Combined Query:**
```graphql
query {
  auth {
    users {
      currentUser {
        id
        email
      }
    }
  }
  catalog {
    products {
      products(limit: 10) {
        id
        name
        price
      }
    }
  }
  commerce {
    orders {
      userOrders {
        id
        status
        total
      }
    }
  }
}
```

## CLI Examples

### Basic Commands

```bash
# Parse a single file
gql-federation-schema-parser parse -d ./schema.graphql -s users -n platform

# Parse a directory
gql-federation-schema-parser parse -d ./schemas -s users -n platform

# Parse with output to file
gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file

# Parse with custom output file
gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file -o custom-schema.graphql
```

### Debug Mode

```bash
# Enable debug output
gql-federation-schema-parser parse -d ./schemas -s users -n platform -D

# Disable colors (useful for CI)
gql-federation-schema-parser parse -d ./schemas -s users -n platform -S
```

### Help Commands

```bash
# General help
gql-federation-schema-parser --help

# Parse command help
gql-federation-schema-parser parse --help

# Version information
gql-federation-schema-parser --version
```

## Integration Examples

### NPM Script Integration

**package.json:**
```json
{
  "scripts": {
    "build:schema": "gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file",
    "build:schema:debug": "gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file -D"
  }
}
```

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Build Schema
on:
  push:
    paths:
      - 'schemas/**'

jobs:
  build-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install CLI
        run: npm install -g @tiagoboeing/gql-federation-schema-parser

      - name: Build Schema
        run: gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file -S
        
      - name: Upload Schema
        uses: actions/upload-artifact@v2
        with:
          name: schema
          path: users-schema.graphql
```

### Docker Integration

**Dockerfile:**
```dockerfile
FROM node:18-alpine

# Install CLI
RUN npm install -g @tiagoboeing/gql-federation-schema-parser

# Copy schemas
COPY schemas/ /app/schemas/

# Build schema
WORKDIR /app
RUN gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file

# Copy to output
COPY users-schema.graphql /output/
```

### Makefile Integration

**Makefile:**
```makefile
.PHONY: build-schema
build-schema:
	gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file

.PHONY: build-schema-debug
build-schema-debug:
	gql-federation-schema-parser parse -d ./schemas -s users -n platform --write-to-file -D

.PHONY: validate-schema
validate-schema: build-schema
	# Add schema validation commands here
```

## Troubleshooting Examples

### Common Issues

**Issue: "Path does not exist"**
```bash
# Problem
gql-federation-schema-parser parse -d ./nonexistent -s users -n platform

# Solution: Check directory exists
ls -la ./schemas
gql-federation-schema-parser parse -d ./schemas -s users -n platform
```

**Issue: "No valid schema definitions found"**
```bash
# Problem: No .graphql files found
gql-federation-schema-parser parse -d ./src -s users -n platform

# Solution: Check file extensions
find ./src -name "*.graphql"
# or
gql-federation-schema-parser parse -d ./src -s users -n platform -D
```

**Issue: Invalid GraphQL syntax**
```bash
# Enable debug mode to see parsing errors
gql-federation-schema-parser parse -d ./schemas -s users -n platform -D
```

### Testing Scenarios

**Test with minimal schema:**
```graphql
# test.graphql
type User {
  id: ID!
}

type Query {
  user: User
}
```

```bash
gql-federation-schema-parser parse -d ./test.graphql -s test -n test
```

**Test with complex nested types:**
```graphql
type User {
  id: ID!
  posts: [Post!]!
}

type Post {
  id: ID!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  author: User!
  post: Post!
}
```

### Performance Testing

**Large schema directory:**
```bash
# Time the operation
time gql-federation-schema-parser parse -d ./large-schemas -s content -n platform

# With debug to see processing details
gql-federation-schema-parser parse -d ./large-schemas -s content -n platform -D
```

**Memory usage monitoring:**
```bash
# Monitor memory usage during parsing
/usr/bin/time -v gql-federation-schema-parser parse -d ./schemas -s users -n platform
```

## Best Practices

### Schema Organization

```
schemas/
├── types/           # Type definitions
│   ├── user.graphql
│   ├── post.graphql
│   └── comment.graphql
├── inputs/          # Input objects
│   ├── user-inputs.graphql
│   └── post-inputs.graphql
├── enums/           # Enum definitions
│   └── common-enums.graphql
└── root/            # Root types
    ├── queries.graphql
    └── mutations.graphql
```

### Naming Conventions

- Use descriptive service names: `users`, `posts`, `orders`
- Use consistent namespace names: `platform`, `ecommerce`, `auth`
- Follow GraphQL naming conventions in your schemas

### File Organization

- Keep related types in the same file
- Separate inputs from outputs
- Use descriptive filenames
- Maintain consistent directory structure

### Error Handling

- Always test with `-D` flag first
- Validate GraphQL syntax before processing
- Check file permissions and paths
- Use version control for schema files

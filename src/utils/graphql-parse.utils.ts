import {
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  print
} from 'graphql'

/**
 * Generates a GraphQL type definition string with proper prefixing and formatting.
 *
 * This function takes a GraphQL type object and generates its string representation
 * suitable for use in a federated GraphQL schema. It handles all GraphQL type kinds
 * including scalars, enums, interfaces, unions, input objects, and object types.
 *
 * @param type - The GraphQL type object to generate a definition for
 * @param prefix - The prefix to apply to non-primitive types (e.g., "PlatformUsers__")
 * @returns The formatted GraphQL type definition string
 *
 * @example
 * ```typescript
 * const userType = new GraphQLObjectType({
 *   name: 'User',
 *   fields: {
 *     id: { type: GraphQLID },
 *     name: { type: GraphQLString }
 *   }
 * });
 *
 * const result = generateTypeDefinition(userType, 'PlatformUsers__');
 * // Returns: "type PlatformUsers__User {\n  id: ID!\n  name: String\n}"
 * ```
 */
export function generateTypeDefinition(type, prefix: string) {
  // Scalar
  if (type instanceof GraphQLScalarType) {
    return `scalar ${type.name}`

    // Enum
  } else if (type instanceof GraphQLEnumType) {
    const values = type.getValues()

    return `enum ${prefix}${type.name} {
  ${values
    .map((val) => {
      const directives = val.astNode?.directives?.length
        ? ' ' + val.astNode.directives.map((d) => print(d)).join(' ')
        : ''

      return `${val.name}${directives}`
    })
    .join('\n  ')}
}`

    // Interface
  } else if (type instanceof GraphQLInterfaceType) {
    const fields = type.getFields()
    const fieldDefinitions = Object.values(fields).map((field) =>
      generateFieldDefinition(field, prefix)
    )

    return `interface ${type.name} {
  ${fieldDefinitions.join('\n  ')}
}`

    // Union
  } else if (type instanceof GraphQLUnionType) {
    const types = type.getTypes()
    return `union ${type.name} = ${types.map((t) => t.name).join(' | ')}`

    // Inputs
  } else if (type instanceof GraphQLInputObjectType) {
    const fields = type.getFields()

    const fieldDefinitions = Object.values(fields).map((field) => {
      const defaultValue =
        field.defaultValue !== undefined
          ? ` = ${JSON.stringify(field.defaultValue)}`
          : ''

      const transformedType = transformTypeName(field.type, prefix)

      return `${field.name}: ${transformedType}${defaultValue}`
    })

    return `input ${prefix}${type.name} {
  ${fieldDefinitions.join('\n  ')}
}`

    // Object Types
  } else if (type instanceof GraphQLObjectType) {
    const fields = type.getFields()
    const fieldDefinitions = Object.values(fields).map((field) =>
      generateFieldDefinition(field, prefix)
    )

    if (fieldDefinitions.length === 0) return '' // Skip empty types

    // Handle directives on types if needed
    const typeDirectives = type.astNode?.directives?.length
      ? ' ' + type.astNode.directives.map((d) => print(d)).join(' ')
      : ''

    return `type ${prefix}${type.name}${typeDirectives} {
  ${fieldDefinitions.join('\n  ')}
}`
  }
  return ''
}

/**
 * Transforms a GraphQL type name by adding a prefix to non-primitive types.
 *
 * This function analyzes a GraphQL type string and adds the specified prefix
 * to custom types while preserving primitive types unchanged. It maintains
 * all GraphQL type modifiers like nullability (!) and list notation ([]).
 *
 * @param typeStr - The GraphQL type string to transform (e.g., "String!", "[User!]!")
 * @param prefix - The prefix to add to non-primitive types
 * @returns The transformed type string with prefix applied to custom types
 *
 * @example
 * ```typescript
 * // Primitive types remain unchanged
 * transformTypeName("String!", "MyService__") // Returns: "String!"
 * transformTypeName("Int", "MyService__") // Returns: "Int"
 *
 * // Custom types get prefixed
 * transformTypeName("User!", "MyService__") // Returns: "MyService__User!"
 * transformTypeName("[Post!]!", "MyService__") // Returns: "[MyService__Post!]!"
 * ```
 */
export function transformTypeName(typeStr, prefix: string) {
  const primitiveTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID',
    'DateTime',
    'JSON',
    'JSONObject',
    'BigInt'
  ]

  // Regex para extrair o nome do tipo base (sem ! ou [])
  const typeNameMatch = typeStr.toString().match(/([^\[\]!]+)/)
  if (!typeNameMatch) return typeStr

  const typeName = typeNameMatch[0]

  // Se for um tipo primitivo, retornar sem modificação
  if (primitiveTypes.includes(typeName)) {
    return typeStr
  }

  // Adicionar prefixo ao tipo
  const prefixedType = `${prefix}${typeName}`

  // Substituir o nome do tipo original pelo prefixado, mantendo os modificadores (! e [])
  return typeStr.toString().replace(typeName, prefixedType)
}

/**
 * Generates a GraphQL field definition string with arguments, type transformations, and directives.
 *
 * This function creates a properly formatted GraphQL field definition that includes:
 * - Field arguments with default values
 * - Type name transformations with prefixing
 * - Directive preservation from the original AST
 *
 * @param field - The GraphQL field object containing name, type, args, and AST node
 * @param prefix - The prefix to apply to non-primitive types in the field and arguments
 * @returns A formatted GraphQL field definition string
 *
 * @example
 * ```typescript
 * // Simple field without arguments
 * const simpleField = { name: 'id', type: 'ID!', args: [] };
 * generateFieldDefinition(simpleField, 'MyService__');
 * // Returns: "id: ID!"
 *
 * // Field with arguments and custom types
 * const complexField = {
 *   name: 'user',
 *   type: 'User',
 *   args: [
 *     { name: 'id', type: 'ID!', defaultValue: undefined },
 *     { name: 'includeProfile', type: 'Boolean', defaultValue: false }
 *   ]
 * };
 * generateFieldDefinition(complexField, 'MyService__');
 * // Returns: "user(id: ID!, includeProfile: Boolean = false): MyService__User"
 * ```
 */
// Function to dynamically generate field definitions
export function generateFieldDefinition(field, prefix: string) {
  let args = ''
  if (field.args && field.args.length > 0) {
    args = `(${field.args
      .map((arg) => {
        const defaultValue =
          arg.defaultValue !== undefined
            ? ` = ${JSON.stringify(arg.defaultValue)}`
            : ''

        const transformedType = transformTypeName(arg.type, prefix)

        return `${arg.name}: ${transformedType}${defaultValue}`
      })
      .join(', ')})`
  }

  // Handle directives on fields if needed
  const directives = field.astNode?.directives?.length
    ? ' ' + field.astNode.directives.map((d) => print(d)).join(' ')
    : ''

  const transformedType = transformTypeName(field.type, prefix)

  return `${field.name}${args}: ${transformedType}${directives}`
}

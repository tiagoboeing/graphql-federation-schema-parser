import {
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  print
} from 'graphql'

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

export function transformTypeName(typeStr, prefix: string) {
  // Exemplo: adicionar prefixo aos tipos personalizados, preservando tipos primitivos e modificadores (! e [])
  // Esta é uma implementação básica - você pode precisar de uma lógica mais complexa dependendo dos seus requisitos

  // Preservar tipos primitivos como String, Int, Boolean, etc.
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

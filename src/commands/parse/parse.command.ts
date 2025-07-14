import { mergeTypeDefs } from '@graphql-tools/merge'
import { ConsolaInstance } from 'consola'
import {
  buildSchema,
  print,
  printSchema,
  GraphQLScalarType,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLObjectType
} from 'graphql'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { findSchemaFiles, readFiles } from '../../utils/read-schema-files.utils'
import { ParseCommandOptions } from './parse.model'

export default async function execute(
  args: ParseCommandOptions,
  logger: ConsolaInstance
) {
  logger.start('Starting schema parsing...')
  logger.debug('Args =', args)

  const finalSchemaFile = args.outputFile ?? `${args.serviceName}-schema.graphql`

  // Read all schema files from the specified directory
  const schemaDirectory = args.directory
  const schemaFiles = findSchemaFiles(schemaDirectory, logger)
  logger.debug('Schema files found:', schemaFiles)

  const schemaContents = readFiles(schemaFiles)
  logger.debug('Schema contents read successfully.')

  // Merge types, queries, mutations, and subscriptions into a single schema
  const mergedSchemas = mergeTypeDefs(schemaContents)
  logger.debug('Schemas merged successfully.')

  // Check if merged schemas is valid
  if (
    !mergedSchemas ||
    !mergedSchemas.definitions ||
    mergedSchemas.definitions.length === 0
  ) {
    logger.error(
      'No valid schema definitions found. Please check your schema files.'
    )
    process.exit(1)
  }

  const schema = buildSchema(
    mergedSchemas.definitions.map((def) => print(def)).join('\n')
  )
  logger.debug('Schema built successfully.')

  // Get the Query type from the schema
  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  const subscriptionType = schema.getSubscriptionType()

  // Get all fields (queries, mutations, subscriptions)
  const queries = queryType ? queryType.getFields() : {}
  const mutations = mutationType ? mutationType.getFields() : {}
  const subscriptions = subscriptionType ? subscriptionType.getFields() : {}

  // Get all other types
  const typeMap = schema.getTypeMap()
  const otherTypes = Object.keys(typeMap)
    .filter(
      (typeName) =>
        typeName !== 'Query' &&
        typeName !== 'Mutation' &&
        typeName !== 'Subscription' &&
        !typeName.startsWith('__') // Ignore introspection types
    )
    .map((typeName) => typeMap[typeName])

  // Get directives
  const directives = schema
    .getDirectives()
    .filter(
      (directive) =>
        !['include', 'skip', 'deprecated', 'specifiedBy'].includes(directive.name)
    )

  // Function to dynamically generate field definitions
  function generateFieldDefinition(field) {
    let args = ''
    if (field.args && field.args.length > 0) {
      args = `(${field.args
        .map((arg) => {
          const defaultValue =
            arg.defaultValue !== undefined
              ? ` = ${JSON.stringify(arg.defaultValue)}`
              : ''
          return `${arg.name}: ${arg.type}${defaultValue}`
        })
        .join(', ')})`
    }

    // Handle directives on fields if needed
    const directives = field.astNode?.directives?.length
      ? ' ' + field.astNode.directives.map((d) => print(d)).join(' ')
      : ''

    return `${field.name}${args}: ${field.type}${directives}`
  }

  // Function to generate type definitions
  function generateTypeDefinition(type) {
    if (type instanceof GraphQLScalarType) {
      return `scalar ${type.name}`
    } else if (type instanceof GraphQLEnumType) {
      const values = type.getValues()
      return `enum ${type.name} {
  ${values
    .map((val) => {
      const directives = val.astNode?.directives?.length
        ? ' ' + val.astNode.directives.map((d) => print(d)).join(' ')
        : ''
      return `${val.name}${directives}`
    })
    .join('\n  ')}
}`
    } else if (type instanceof GraphQLInterfaceType) {
      const fields = type.getFields()
      const fieldDefinitions = Object.values(fields).map(generateFieldDefinition)
      return `interface ${type.name} {
  ${fieldDefinitions.join('\n  ')}
}`
    } else if (type instanceof GraphQLUnionType) {
      const types = type.getTypes()
      return `union ${type.name} = ${types.map((t) => t.name).join(' | ')}`
    } else if (type instanceof GraphQLInputObjectType) {
      const fields = type.getFields()
      const fieldDefinitions = Object.values(fields).map((field) => {
        const defaultValue =
          field.defaultValue !== undefined
            ? ` = ${JSON.stringify(field.defaultValue)}`
            : ''
        return `${field.name}: ${field.type}${defaultValue}`
      })
      return `input ${type.name} {
  ${fieldDefinitions.join('\n  ')}
}`
    } else if (type instanceof GraphQLObjectType) {
      const fields = type.getFields()
      const fieldDefinitions = Object.values(fields).map(generateFieldDefinition)
      if (fieldDefinitions.length === 0) return '' // Skip empty types

      // Handle directives on types if needed
      const typeDirectives = type.astNode?.directives?.length
        ? ' ' + type.astNode.directives.map((d) => print(d)).join(' ')
        : ''

      return `type ${type.name}${typeDirectives} {
  ${fieldDefinitions.join('\n  ')}
}`
    }
    return ''
  }

  // Generate directive definitions
  const directiveDefinitions = directives.map((directive) => {
    const args =
      directive.args.length > 0
        ? `(${directive.args.map((arg) => `${arg.name}: ${arg.type}`).join(', ')})`
        : ''

    const locations = directive.locations.join(' | ')

    return `directive @${directive.name}${args} on ${locations}`
  })

  // Generate definitions
  const queryDefinitions = Object.values(queries).map(generateFieldDefinition)
  const mutationDefinitions = Object.values(mutations).map(generateFieldDefinition)
  const subscriptionDefinitions = Object.values(subscriptions).map(
    generateFieldDefinition
  )

  // Group types by category for better organization
  const scalarTypes = otherTypes.filter((type) => type instanceof GraphQLScalarType)
  const enumTypes = otherTypes.filter((type) => type instanceof GraphQLEnumType)
  const interfaceTypes = otherTypes.filter(
    (type) => type instanceof GraphQLInterfaceType
  )
  const unionTypes = otherTypes.filter((type) => type instanceof GraphQLUnionType)
  const inputTypes = otherTypes.filter(
    (type) => type instanceof GraphQLInputObjectType
  )
  const objectTypes = otherTypes.filter((type) => type instanceof GraphQLObjectType)

  const scalarDefinitions = scalarTypes.map(generateTypeDefinition).filter(Boolean)
  const enumDefinitions = enumTypes.map(generateTypeDefinition).filter(Boolean)
  const interfaceDefinitions = interfaceTypes
    .map(generateTypeDefinition)
    .filter(Boolean)
  const unionDefinitions = unionTypes.map(generateTypeDefinition).filter(Boolean)
  const inputDefinitions = inputTypes.map(generateTypeDefinition).filter(Boolean)
  const objectDefinitions = objectTypes.map(generateTypeDefinition).filter(Boolean)
  logger.box({
    title: 'Schema parsing results',
    message: `Queries: ${queryDefinitions.length}
Mutations: ${mutationDefinitions.length}
Subscriptions: ${subscriptionDefinitions.length}
Scalars: ${scalarDefinitions.length}
Enums: ${enumDefinitions.length}
Interfaces: ${interfaceDefinitions.length}
Unions: ${unionDefinitions.length}
Input Types: ${inputDefinitions.length}
Object Types: ${objectDefinitions.length}
Directives: ${directiveDefinitions.length}`
  })

  // Create new schema file with the manipulated schema
  const generatedSchema = `
${directiveDefinitions.length > 0 ? directiveDefinitions.join('\n\n') : ''}

${scalarDefinitions.length > 0 ? scalarDefinitions.join('\n') : ''}

${enumDefinitions.length > 0 ? enumDefinitions.join('\n\n') : ''}

${interfaceDefinitions.length > 0 ? interfaceDefinitions.join('\n\n') : ''}
${unionDefinitions.length > 0 ? unionDefinitions.join('\n\n') : ''}
${inputDefinitions.length > 0 ? inputDefinitions.join('\n\n') : ''}

${objectDefinitions.length > 0 ? objectDefinitions.join('\n\n') : ''}

type ${args.serviceName}Queries {
  ${queryDefinitions.join('\n  ')}
}

${
  mutationDefinitions.length > 0
    ? `type ${args.serviceName}Mutations {
  ${mutationDefinitions.join('\n  ')}
}`
    : ''
}
${
  subscriptionDefinitions.length > 0
    ? `type ${args.serviceName}Subscriptions {
  ${subscriptionDefinitions.join('\n  ')}
}`
    : ''
}
${
  mutationDefinitions.length > 0
    ? `type NamespaceMutations {
  ${args.serviceName}: ${args.serviceName}Mutations!
}`
    : ''
}

type NamespaceQueries {
  ${args.serviceName}: ${args.serviceName}Queries!
}
${
  subscriptionDefinitions.length > 0
    ? `type NamespaceSubscriptions {
  ${args.serviceName}: ${args.serviceName}Subscriptions!
}`
    : ''
}
${
  mutationDefinitions.length > 0
    ? `type Mutation {
  ${args.namespace}: NamespaceMutations!
}`
    : ''
}

type Query {
  ${args.namespace}: NamespaceQueries!
}

${
  subscriptionDefinitions.length > 0
    ? `type Subscription {
  ${args.namespace}: NamespaceSubscriptions!
}`
    : ''
}
`

  try {
    const validatedSchema = buildSchema(generatedSchema)
    logger.success('Schema parsing completed successfully!')

    // Print
    const printedSchema = printSchema(validatedSchema)
    logger.debug('Generated schema content:\n', printedSchema)

    if (args.writeToFile) {
      logger.info('Writing generated schema to file...')
      const outputPath = path.join(process.cwd(), finalSchemaFile)

      logger.debug('Output path:', outputPath)

      writeFileSync(outputPath, generatedSchema, 'utf8')
      logger.ready(`Schema written to ${outputPath}`)
    }

    logger.info(
      'Thank you for using the GQL Federation Schema Parser CLI!\n',
      ' Use this schema to publish to your GraphQL schema registry.\n',
      ' -----------------------------------------------------------\n',
      ' For more information, visit: https://github.com/tiagoboeing/graphql-federation-schema-parser\n'
    )
    logger.ready('🚀 Schema parsing completed successfully!')
  } catch (error) {
    logger.error('Error validating the generated schema:', error)

    // Write the schema anyway so it can be debugged
    if (args.writeToFile) {
      const outputPath = path.join(process.cwd(), finalSchemaFile)
      writeFileSync(outputPath, generatedSchema, 'utf8')
      logger.info(`Schema written to ${outputPath} for debugging purposes`)
    }

    process.exit(1)
  }
}

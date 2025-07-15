import { mergeTypeDefs } from '@graphql-tools/merge'
import { ConsolaInstance } from 'consola'
import {
  buildSchema,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  print,
  printSchema
} from 'graphql'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { findSchemaFiles, readFiles } from '../../utils/read-schema-files.utils'
import { ParseCommandOptions } from './parse.model'
import {
  generateFieldDefinition,
  generateTypeDefinition
} from '../../utils/graphql-parse.utils'
import _ from 'lodash'

/**
 * Main execution function for the parse command.
 *
 * @param args - Configuration options for the parse command
 * @param logger - Consola logger instance for output and debugging
 * @returns Promise that resolves when parsing is complete
 */
export default async function execute(
  args: ParseCommandOptions,
  logger: ConsolaInstance
) {
  logger.start('Starting schema parsing...')
  logger.debug('Args =', args)

  const serviceNameCapitalized = _.upperFirst(_.camelCase(args.serviceName))
  const namespaceCapitalized = _.upperFirst(_.camelCase(args.namespace))

  const prefix = `${namespaceCapitalized}${serviceNameCapitalized}__`

  const finalSchemaFile = args.outputFile ?? `${_.kebabCase(prefix)}-schema.graphql`

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
  const queryDefinitions = Object.values(queries).map((field) =>
    generateFieldDefinition(field, prefix)
  )
  const mutationDefinitions = Object.values(mutations).map((field) =>
    generateFieldDefinition(field, prefix)
  )
  const subscriptionDefinitions = Object.values(subscriptions).map((field) =>
    generateFieldDefinition(field, prefix)
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

  const scalarDefinitions = scalarTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)
  const enumDefinitions = enumTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)

  const interfaceDefinitions = interfaceTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)

  const unionDefinitions = unionTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)
  const inputDefinitions = inputTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)
  const objectDefinitions = objectTypes
    .map((type) => generateTypeDefinition(type, prefix))
    .filter(Boolean)

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

type ${namespaceCapitalized}${serviceNameCapitalized}Queries {
  ${queryDefinitions.join('\n  ')}
}

${
  mutationDefinitions.length > 0
    ? `type ${namespaceCapitalized}${serviceNameCapitalized}Mutations {
  ${mutationDefinitions.join('\n  ')}
}`
    : ''
}
${
  subscriptionDefinitions.length > 0
    ? `type ${namespaceCapitalized}Subscriptions {
  ${subscriptionDefinitions.join('\n  ')}
}`
    : ''
}
${
  mutationDefinitions.length > 0
    ? `type ${namespaceCapitalized}Mutations {
  ${_.camelCase(
    args.serviceName
  )}: ${namespaceCapitalized}${serviceNameCapitalized}Mutations!
}`
    : ''
}

type ${namespaceCapitalized}Queries {
  ${_.camelCase(
    args.serviceName
  )}: ${namespaceCapitalized}${serviceNameCapitalized}Queries!
}
${
  subscriptionDefinitions.length > 0
    ? `type ${namespaceCapitalized}Subscriptions {
  ${_.camelCase(
    args.serviceName
  )}: ${namespaceCapitalized}${serviceNameCapitalized}Subscriptions!
}`
    : ''
}
${
  mutationDefinitions.length > 0
    ? `type Mutation {
  ${_.camelCase(args.namespace)}: ${namespaceCapitalized}Mutations!
}`
    : ''
}

type Query {
  ${_.camelCase(args.namespace)}: ${namespaceCapitalized}Queries!
}

${
  subscriptionDefinitions.length > 0
    ? `type Subscription {
  ${_.camelCase(args.namespace)}: ${namespaceCapitalized}Subscriptions!
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

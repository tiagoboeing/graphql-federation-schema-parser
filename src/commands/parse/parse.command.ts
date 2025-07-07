import { mergeTypeDefs } from '@graphql-tools/merge'
import consola from 'consola'
import { buildSchema, print, printSchema } from 'graphql'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { findSchemaFiles, readFiles } from '../../utils/read-schema-files.utils'
import { ParseCommandOptions } from './parse.model'

export default async function execute(
  args: ParseCommandOptions,
  logger: consola.ConsolaInstance
) {
  logger.start('Starting schema parsing...')
  logger.debug('Args =', args)

  const finalSchemaFile = args.outputFile ?? `${args.serviceName}-schema.graphql`

  // Read all schema files from the specified directory
  const schemaDirectory = args.directory
  const schemaFiles = findSchemaFiles(schemaDirectory)
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

  // Function to dynamically generate field definitions
  function generateFieldDefinition(field) {
    if (field.args && field.args.length > 0) {
      const args = field.args.map((arg) => `${arg.name}: ${arg.type}`).join(', ')
      return `${field.name}(${args}): ${field.type}`
    }

    return `${field.name}: ${field.type}`
  }

  // Function to generate type definitions
  function generateTypeDefinition(type) {
    if ('getFields' in type) {
      const fields = type.getFields()
      const fieldDefinitions = Object.values(fields).map(generateFieldDefinition)
      if (fieldDefinitions.length === 0) return '' // Skip empty types
      return `type ${type.name} {
  ${fieldDefinitions.join('\n  ')}
}`
    }
    return ''
  }

  // Generate definitions
  const queryDefinitions = Object.values(queries).map(generateFieldDefinition)
  const mutationDefinitions = Object.values(mutations).map(generateFieldDefinition)
  const subscriptionDefinitions = Object.values(subscriptions).map(
    generateFieldDefinition
  )
  const otherTypeDefinitions = otherTypes
    .map(generateTypeDefinition)
    .filter((definition) => definition !== '') // Exclude empty types

  logger.box({
    title: 'Schema parsing results',
    message: `Queries: ${queryDefinitions.length}
Mutations: ${mutationDefinitions.length}
Subscriptions: ${subscriptionDefinitions.length}
Other Types: ${otherTypeDefinitions.length}
`
  })

  // Create new schema file with the manipulated schema
  const generatedSchema = `
${otherTypeDefinitions.join('\n\n')}

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
}

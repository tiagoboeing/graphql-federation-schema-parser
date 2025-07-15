/**
 * Configuration options for the parse command.
 * 
 * This interface defines all the available options that can be passed to the
 * parse command when processing GraphQL schema files for federation.
 */
export interface ParseCommandOptions {
  /** The directory path containing GraphQL schema files to parse */
  directory: string
  /** The name of the service (used for prefixing types) */
  serviceName: string
  /** The namespace to group the service under (used for prefixing types) */
  namespace: string
  /** Enable verbose output for debugging (optional) */
  verbose?: boolean
  /** Whether to write output to a file instead of stdout (optional) */
  writeToFile?: boolean
  /** Custom output file name (optional, defaults to serviceName-schema.graphql) */
  outputFile?: string
}

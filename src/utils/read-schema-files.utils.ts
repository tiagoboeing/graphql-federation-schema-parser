import { ConsolaInstance } from 'consola'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Reads multiple schema files and returns their contents as an array of strings.
 *
 * This function synchronously reads all provided file paths and returns their
 * contents as UTF-8 encoded strings. If any error occurs during reading,
 * it logs the error and returns an empty array.
 *
 * @param files - Array of absolute file paths to read
 * @returns Array of file contents as strings, or empty array if error occurs
 *
 * @example
 * ```typescript
 * const files = ['/path/to/schema1.graphql', '/path/to/schema2.graphql'];
 * const contents = readFiles(files);
 * // Returns: ['type User { id: ID! }', 'type Post { id: ID! }']
 * ```
 */
export function readFiles(files: string[]): string[] {
  try {
    return files.map((file) => fs.readFileSync(file, 'utf-8'))
  } catch (error) {
    console.error('Error reading schema files:', error)
    return []
  }
}

/**
 * Recursively finds all GraphQL schema files in a directory or validates a single file.
 *
 * This function searches for .graphql files in the specified directory and its
 * subdirectories. It can handle both file paths and directory paths:
 * - If given a file path, it validates the file has a .graphql extension
 * - If given a directory path, it recursively searches for all .graphql files
 *
 * @param directory - The directory path to search or file path to validate
 * @param logger - Consola logger instance for debug and error messages
 * @returns Array of absolute paths to found .graphql files
 *
 * @example
 * ```typescript
 * // Search in a directory
 * const files = findSchemaFiles('./schemas', logger);
 * // Returns: ['/absolute/path/to/schemas/users.graphql', '/absolute/path/to/schemas/posts.graphql']
 *
 * // Validate a single file
 * const files = findSchemaFiles('./users.graphql', logger);
 * // Returns: ['/absolute/path/to/users.graphql']
 * ```
 */
export const findSchemaFiles = (
  directory: string,
  logger: ConsolaInstance
): string[] => {
  try {
    const fullDirectory = path.isAbsolute(directory)
      ? directory
      : path.resolve(process.cwd(), directory)

    // Check if the path exists
    if (!fs.existsSync(fullDirectory)) {
      logger.error(`Path does not exist: ${fullDirectory}`)
      return []
    }

    // Check if it's a file or directory
    const stats = fs.statSync(fullDirectory)

    // If it's a file and ends with .graphql, return it directly
    if (stats.isFile()) {
      logger.debug(`Found file: ${fullDirectory}`)

      return fullDirectory.endsWith('.graphql') ? [fullDirectory] : []
    }

    // If it's a directory, search recursively
    if (stats.isDirectory()) {
      logger.debug(`Searching in directory: ${fullDirectory}`)

      const files = fs.readdirSync(fullDirectory, { recursive: true }) as string[]
      logger.debug(`Files and folders found in directory:`, files)

      logger.debug(
        `Starting filtering for .graphql files in directory:`,
        fullDirectory
      )

      const schemaFiles = files
        .filter((file) => {
          const filePath = path.join(fullDirectory, file)
          logger.debug(`Checking path:`, filePath)

          try {
            // Make sure it's a file and not a directory
            const isFile =
              fs.statSync(filePath).isFile() && file.endsWith('.graphql')

            logger.debug(`${filePath} is a valid schema file:`, isFile)

            return isFile
          } catch (error) {
            // In case the file cannot be accessed or doesn't exist anymore
            logger.error(`Error checking file ${filePath}:`, error)
            return false
          }
        })
        .map((file) => path.join(fullDirectory, file))

      return schemaFiles
    }

    return []
  } catch (error) {
    logger.error('Error reading schema files:', error)
    return []
  }
}

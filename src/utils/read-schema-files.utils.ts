import { ConsolaInstance } from 'consola'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export function readFiles(files: string[]): string[] {
  try {
    return files.map((file) => fs.readFileSync(file, 'utf-8'))
  } catch (error) {
    console.error('Error reading schema files:', error)
    return []
  }
}

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

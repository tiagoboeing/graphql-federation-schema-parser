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

export const findSchemaFiles = (directory: string): string[] => {
  try {
    const fullDirectory = path.isAbsolute(directory)
      ? directory
      : path.resolve(process.cwd(), directory)

    const files = fs.readdirSync(fullDirectory)
    const schemaFiles = files
      .filter((file) => file.endsWith('.graphql'))
      .map((file) => path.join(fullDirectory, file))

    return schemaFiles
  } catch (error) {
    console.error('Error reading schema files:', error)
    return []
  }
}

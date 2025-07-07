import { createConsola } from 'consola'

export enum ConsolaLogLevel {
  FatalAndError = 0,
  Warning = 1,
  Normal = 2,
  Info = 3,
  Debug = 4,
  Trace = 5,
  Silent = -999,
  Verbose = 999
}

// Verificar se está rodando como binário compilado
const isPackaged = process.argv[0].includes('gql-federation-schema-parser')

export function appLogger(logLevel = ConsolaLogLevel.Info, useColors?: boolean) {
  const shouldUseColors = useColors !== undefined ? useColors : !isPackaged

  return createConsola({
    level: logLevel,

    // fancy: isPackaged ? false : shouldUseColors,
    formatOptions: {
      colors: shouldUseColors,
      columns: process.stdout.columns || 80
    }
  })
}

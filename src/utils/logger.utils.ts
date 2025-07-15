import { createConsola } from 'consola'

/**
 * Enumeration of log levels for the Consola logger.
 *
 * These levels control the verbosity of logging output, from silent to verbose.
 * Lower numbers represent more critical messages, while higher numbers include
 * more detailed information.
 */
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

export function appLogger(logLevel = ConsolaLogLevel.Info, useColors?: boolean) {
  return createConsola({
    level: logLevel,
    formatOptions: {
      colors: useColors,
      columns: process.stdout.columns || 80
    }
  })
}

import { createConsola, ConsolaReporter } from 'consola'

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

const logEmojis = {
  success: '✅ ',
  info: 'ℹ️ ',
  error: '❌ ',
  warn: '⚠️ ',
  debug: '🔍 ',
  trace: '🔬 ',
  fatal: '💀 ',
  log: '📝 ',
  ready: '🚀 ',
  start: '🏁 ',
  box: '📦 ',
  verbose: '📢 '
}

export const appLogger = (logLevel = ConsolaLogLevel.Info, useColors?: boolean) =>
  createConsola({
    level: logLevel,
    fancy: useColors,
    formatOptions: {
      colors: useColors,
      columns: process.stdout.columns || 80
    }
  })

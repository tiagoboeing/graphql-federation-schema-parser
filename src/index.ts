import { Command } from 'commander'
import figlet from 'figlet'
import { version as packageVersion } from '../package.json'
import parseCommand from './commands/parse/parse.command'
import { appLogger, ConsolaLogLevel } from './utils/logger.utils'

const program = new Command()
let logger = appLogger()

program
  .name('gql-federation-schema-parser')
  .description('CLI tool to parse and manipulate GraphQL schemas for federation')
  .version(packageVersion)
  .addHelpText('before', () => {
    return figlet.textSync('GQL Schema Parser', { font: 'Standard' })
  })
  .option('-D --debug', 'Enable debug mode', false)
  .option('-S --simple', 'Disable colors on terminal', false)
  .hook('preAction', (thisCommand: Command) => {
    const options = thisCommand.opts()

    if (options.debug || options.simple) {
      logger = appLogger(
        options.debug ? ConsolaLogLevel.Debug : ConsolaLogLevel.Info,
        !options.simple
      )

      if (options.simple) logger.info('Terminal colors disabled!')
      if (options.debug) logger.info('Debug mode enabled!')
    }

    logger.info(`Using ${thisCommand.name()} ${thisCommand.version()}`)
  })

// Parse command
program
  .command('parse')
  .description('Parse GraphQL schemas')
  .option(
    '-d --directory <folder>',
    'Directory containing GraphQL schema files',
    './schemas'
  )
  .requiredOption('-s --service-name <name>', 'Name of the service')
  .requiredOption('-n --namespace <namespace>', 'Namespace to scope this service')
  .option('-w --write-to-file', 'Write the generated schema to a file', true)
  .option(
    '-o --output-file <file>',
    'Output file name. Eg.: schema.graphql. Defaults to <serviceName>-schema.graphql'
  )
  .action((args) => parseCommand(args, logger))

program.parse(process.argv)

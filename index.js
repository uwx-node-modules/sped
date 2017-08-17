'use strict';

const program = require('commander');
const fs = require('fs-extra');
const diff = require('diff');
const chalk = require('chalk');
const glob = require('glob');
// TODO minimatch

program
  .name('sped')
  .version(require('./package.json').version)
  .usage('[options] <regex> <file or wildcard...>')
  .option('-r, --recurse', 'always recurse into subdirectories (**/ also works)')
  .option('-w, --wild', 'glob wildcard instead of regex')
  .option('-e, --encoding [encoding]', 'use custom encoding [utf8]', 'utf8')
  .option('-d, --dry-run', "dry run, print but don't write")
  .option('-n, --no-info', "don't print info that would be normally printed to STDERR")
  .parse(process.argv);

if (program.args.length < 2) {
  program.help();
}

const reb = program.args[0].split('/'); // s/from/to/flags

const regex = new RegExp(reb[1], reb[3]);
const replace = reb[2];
program.args = program.args.slice(1);

if (!program.noInfo && program.dryRun) {
  console.error(chalk.bgRed.white('Dry run! Files will not be modified!'));
}

program.args.forEach(arg => {
  if (program.recurse && arg.includes('*')) {
    arg = '**/' + arg;
  }
  glob.sync(arg).forEach(f => {
    if (!program.noInfo) console.error(chalk.blue('-- ' + f));

    const file = fs.readFileSync(f, program.encoding);

    if (!program.dryRun) {
      const toFile = file.replace(regex, replace);
      if (file != toFile) {
        if (!program.noInfo) console.error(chalk.blue('--- file differs'));
        fs.writeFileSync(f, toFile);
      }
    } else {
      console.log(diff.diffLines(file, file.replace(regex, replace)).map(part => {
        const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        return chalk[color](part.value);
      }).join(''));
    }
  });
});
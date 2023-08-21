import chalk from "chalk";
import { program } from "commander";
import {
  filter,
  from,
  identity,
  map,
  mergeAll,
  mergeMap,
  take,
  tap,
  toArray,
} from "rxjs";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { applyMetaTemplate, defaultTemplates } from "./template.js";
import { topCountByTemplate } from "./utils.js";
import { endsongData } from "./validators.js";

interface Options {
  limit: number;
  path: string;

  after?: string;
  before?: string;
  threshold?: number;
}

function run(template: string, options: Options): void {
  console.debug("Using template", chalk.yellow(template));
  console.debug("Reading directory", chalk.blue(options.path));

  /** Stream of all parsed "endsong.json" entries. */
  const endsongDatum$ = from(readdir(options.path, { encoding: "utf-8" })).pipe(
    mergeAll(),
    filter((filename) => filename.startsWith("endsong")),
    map((endsongName) => join(options.path, endsongName)),
    tap((endsongPath) =>
      console.debug("Reading file", chalk.blue(endsongPath))
    ),
    mergeMap((endsongPath) => readFile(endsongPath, { encoding: "utf-8" })),
    mergeMap((json) => endsongData.parse(JSON.parse(json)))
  );

  endsongDatum$
    .pipe(
      options.after
        ? filter((datum) => Date.parse(datum.ts) > Date.parse(options.after!))
        : identity,
      options.before
        ? filter((datum) => Date.parse(datum.ts) < Date.parse(options.before!))
        : identity,
      options.threshold
        ? filter((datum) => datum.ms_played >= options.threshold! * 1000)
        : identity,
      toArray(),
      mergeMap((data) => topCountByTemplate(data, template)),
      options.limit ? take(options.limit) : identity,
      map(([template, count], i) => applyMetaTemplate(template, i + 1, count))
    )
    .subscribe(console.log);
}

program
  .name("SpotiSpy")
  .description('A Node.js script for parsing Spotify "endsong.json" files');

program
  .option("-a, --after <date>", "only list results after this date")
  .option("-b, --before <date>", "only list results before this date")
  .option("-l, --limit <number>", "maximum number of results to show", "100")
  .option("-p, --path <path>", 'path to extracted Spotify "MyData" directory')
  .option("-t, --threshold <seconds>", "minumum track play length to include");

program
  .command("album")
  .description("list the top N albums")
  .action(() => run(defaultTemplates.album, program.opts()));
program
  .command("artist")
  .description("list the top N artists")
  .action(() => run(defaultTemplates.artist, program.opts()));
program
  .command("track")
  .description("list the top N tracks")
  .action(() => run(defaultTemplates.track, program.opts()));
program
  .command("template <template>")
  .description("list the top N results matching the custom template")
  .action((template: string) => run(template, program.opts()));

program.parse();

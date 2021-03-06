import commandLineArgs from "command-line-args";
import type { OptionDefinition } from "command-line-args";
import { promises as fsPromises } from "fs";
import _ from "lodash";
import { join } from "path";
import pluralize from "pluralize";

import type { StreamingHistory, TrackEntry } from "../types";

/** Command-line arguments. */
interface Options {
  /** End date limit (exclusive) string parsable by `new Date`. */
  cutoff?: string;
  /** Top `n` artists to list. */
  limit?: number;
  /** Path to Spotify data directory. */
  path?: string;
  /** Minimum play duration in seconds (inclusive). */
  threshold?: number;
}

/** Command-line argument definitions. */
const OPTION_DEFINITIONS: OptionDefinition[] = [
  { name: "cutoff", alias: "c", type: String },
  { name: "limit", alias: "l", type: Number },
  { name: "path", alias: "p", type: String },
  { name: "threshold", alias: "t", type: Number },
];

/**
 * Read "StreamingHistoryN.json" files from the passed path, returning a single streaming history.
 *
 * @param path Spotify data folder path
 * @return Concatenated array of all streaming history track entries
 */
async function readStreamingHistory(path: string): Promise<TrackEntry[]> {
  const names = await fsPromises.readdir(path);
  const streamingHistoryNames = names
    .filter((name) => name.startsWith("StreamingHistory"))
    .sort();

  const promises = streamingHistoryNames.map(async (name) => {
    const streamingHistoryPath = join(path, name);
    const contents = await fsPromises.readFile(streamingHistoryPath, {
      encoding: "utf-8",
    });
    return JSON.parse(contents) as StreamingHistory;
  });

  const streamingHistories = await Promise.all(promises);
  return streamingHistories.flat();
}

/**
 * Given a streaming history, count track plays by artist.
 *
 * @param data Streaming history track entries
 * @return Array of `[artist, count]` tuples in count-descending order
 */
function countByArtist(data: TrackEntry[]): [artist: string, count: number][] {
  return _.chain(data)
    .groupBy("artistName")
    .mapValues("length")
    .entries()
    .value()
    .sort(([, count1], [, count2]) => count2 - count1);
}

/**
 * Given a streaming history, retain entries that are within the passed cutoff date and play
 * duration threshold.
 *
 * @param data Streaming history track entries
 * @param cutoffDate End time to filter track entries by
 * @param playedThreshold Play duration to filter track entries by
 * @return Array of filtered streaming history track entries
 */
function filterStreamingHistory(
  data: TrackEntry[],
  cutoffDate?: Date,
  playedThreshold?: number
): TrackEntry[] {
  let filtered = data;
  if (cutoffDate) {
    filtered = filtered.filter(({ endTime }) => new Date(endTime) < cutoffDate);
  }
  if (playedThreshold) {
    filtered = filtered.filter(({ msPlayed }) => msPlayed >= playedThreshold);
  }

  return filtered;
}

// Parse CLI args
const options = commandLineArgs(OPTION_DEFINITIONS) as Options;
if (!options.path) {
  throw Error("`--path` must be defined! Refer to the sample usage.");
}

const streamingHistory = await readStreamingHistory(options.path);
console.log("Loaded", pluralize("track", streamingHistory.length, true));

const filteredStreamingHistory = filterStreamingHistory(
  streamingHistory,
  options.cutoff ? new Date(options.cutoff) : undefined,
  options.threshold ? options.threshold * 1000 : undefined
);

const filteredCount = streamingHistory.length - filteredStreamingHistory.length;
if (filteredCount) {
  console.log("Filtered", pluralize("track", filteredCount, true));
}

console.log();

const artistCounts = countByArtist(filteredStreamingHistory).slice(
  0,
  options.limit
);
console.log(`Top ${pluralize("artist count", artistCounts.length, true)}:`);

artistCounts.forEach(([artist, count], i) => {
  console.log(`${i + 1}. ${artist}:`, pluralize("play", count, true));
});

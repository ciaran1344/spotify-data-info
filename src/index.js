import { promises as fsPromises } from "fs";
import _ from "lodash";
import { join } from "path";
import pluralize from "pluralize";
const DATA_PATH = "./data";
const CUT_OFF_DATE = new Date("14 Feb 2021");
/**
 * @param path Spotify data folder path.
 */
async function readStreamingHistory(path) {
    const files = await fsPromises.readdir(path);
    const streamingHistoryFiles = files.filter((file) => {
        return file.startsWith("StreamingHistory");
    });
    const promises = streamingHistoryFiles.map(async (file) => {
        const contents = await fsPromises.readFile(join(path, file), {
            encoding: "utf-8",
        });
        return JSON.parse(contents);
    });
    const streamingHistories = await Promise.all(promises);
    return streamingHistories.flat();
}
function countByArtist(data, limit) {
    const trackEntriesByArtist = _.groupBy(data, "artistName");
    const artistCounts = _.mapValues(trackEntriesByArtist, "length");
    const sortedEntries = Object.entries(artistCounts).sort(([, count1], [, count2]) => count2 - count1);
    return limit ? sortedEntries.slice(0, limit) : sortedEntries;
}
const streamingHistory = await readStreamingHistory(DATA_PATH);
const preLastFmStreamingHistory = streamingHistory.filter(({ endTime }) => new Date(endTime) < CUT_OFF_DATE);
console.log(`Removed ${streamingHistory.length - preLastFmStreamingHistory.length} overlapping entries`);
const artistCounts = countByArtist(preLastFmStreamingHistory, 50);
artistCounts.forEach(([artist, count]) => {
    console.log(`${artist}:`, pluralize("play", count, true));
});

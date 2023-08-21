import { NULL } from "./constants.js";
import { DataTemplateKey, TemplateKey } from "./types/index.js";
import { EndsongDatum } from "./validators.js";

function createDefaultTemplate(innerTemplate: string): string {
  return `#%rank ${innerTemplate}: %count plays`;
}

export const defaultTemplates = {
  album: createDefaultTemplate("%artist - %album"),
  artist: createDefaultTemplate("%artist"),
  track: createDefaultTemplate("%artist - %track"),
};

export function applyMetaTemplate(
  template: string,
  rank: number,
  count: number
): string {
  return template
    .replace("%count" satisfies TemplateKey, count.toString())
    .replace("%rank" satisfies TemplateKey, rank.toString());
}

const DATA_TEMPLATE_MAP: Record<DataTemplateKey, keyof EndsongDatum> = {
  "%album": "master_metadata_album_album_name",
  "%artist": "master_metadata_album_artist_name",
  "%track": "master_metadata_track_name",
  "%trackUri": "spotify_track_uri",
};

export function applyDataTemplate(
  template: string,
  datum: EndsongDatum
): string {
  return Object.entries(DATA_TEMPLATE_MAP).reduce(
    (acc, [templateKey, endsongKey]) =>
      acc.replace(templateKey, datum[endsongKey]?.toString() || NULL),
    template
  );
}

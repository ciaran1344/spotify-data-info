import { z } from "zod";

export const endsongDatum = z.object({
  conn_country: z.string(),
  episode_name: z.nullable(z.string()),
  episode_show_name: z.nullable(z.string()),
  incognito_mode: z.boolean(),
  ip_addr_decrypted: z.string().ip(),
  master_metadata_album_album_name: z.nullable(z.string()),
  master_metadata_album_artist_name: z.nullable(z.string()),
  master_metadata_track_name: z.nullable(z.string()),
  ms_played: z.number().int(),
  offline_timestamp: z.number().int(),
  offline: z.boolean(),
  platform: z.string(),
  reason_end: z.string(),
  reason_start: z.string(),
  shuffle: z.boolean(),
  skipped: z.boolean(),
  spotify_episode_uri: z.nullable(z.string()),
  spotify_track_uri: z.nullable(z.string()),
  ts: z.string().datetime(),
  user_agent_decrypted: z.string(),
  username: z.string(),
});

export const endsongData = z.array(endsongDatum);

export type EndsongDatum = z.infer<typeof endsongDatum>;

export type EndsongData = z.infer<typeof endsongData>;

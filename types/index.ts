export interface TrackEntry {
  artistName: string;
  /** YYYY-MM-DD HH:ss */
  endTime: string;
  msPlayed: number;
  trackName: string;
}

/** "StreamingHistoryN.json" file contents. */
export type StreamingHistory = TrackEntry[];

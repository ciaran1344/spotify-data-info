export interface TrackEntry {
  artistName: string;
  /** YYYY-MM-DD HH:ss */
  endTime: string;
  msPlayed: number;
  trackName: string;
}

export type StreamingHistory = TrackEntry[];

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number; // 0–100
  duration_ms: number; // e.g. 90000–300000
  explicit: boolean;
}
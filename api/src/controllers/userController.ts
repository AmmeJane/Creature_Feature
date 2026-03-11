// src/controllers/userController.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import axios, { AxiosResponse } from "axios";
import { CREATURE_TYPES, Creature } from "../types/CreatureTypes";
import { SpotifyTrack } from "../types/SpotifyTypes";
import { User } from "../types/UserTypes";

const DATA_FILE = path.join(__dirname, "../data/users.json");


// ----- FILE I/O -----
function readUsers(): Record<string, User> {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw || "{}");
}

function saveUsers(users: Record<string, User>): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ----- SPOTIFY API -----
async function getUserTopTracks(
  token: string,
  limit = 5,
): Promise<SpotifyTrack[]> {
  try {
    const res: AxiosResponse<{ items: any[] }> = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, time_range: "long_term" },
      },
    );

    return res.data.items.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      popularity: t.popularity as number,
      duration_ms: t.duration_ms as number,
      explicit: t.explicit as boolean,
    }));
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? err.response?.data || err.message
      : String(err);
    console.error("Spotify API error (top tracks):", msg);
    return [];
  }
}

function pickWeightedType(): string {
  const total = CREATURE_TYPES.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of CREATURE_TYPES) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return CREATURE_TYPES[0][0];
}

// ----- CREATE CREATURE -----
// Uses only fields from the tracks endpoint (audio-features API is deprecated)
function createCreatureFromTrack(song: SpotifyTrack): Creature {
  // popularity 0–100 → size 0–1 (popular songs = bigger creature)
  const size = song.popularity / 100;

  // duration: typical range 90s–5min (90k–300k ms), normalised then inverted
  // so shorter songs = faster creature
  const durationNorm = Math.min(
    Math.max((song.duration_ms - 90_000) / (300_000 - 90_000), 0),
    1,
  );
  const speed = 1 - durationNorm;

  // peaks at 0 and 1, dips in the middle
  const norm = song.popularity / 100;
  const colour = song.popularity / 100;

  console.log(`Created creature from "${song.name}":`, { size, speed, colour });

  return {
    id: song.id,
    songId: song.id,
    name: `${song.name} Beast`,
    type: pickWeightedType(),
    genes: { size, speed, colour },
  };
}

// ----- CONTROLLERS -----
export const createUserAndGenerateCreatures = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token = (req as any).spotifyToken as string;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  if (!users[spotifyId]) {
    const songs = await getUserTopTracks(token, 5);
    const creatures = songs.map(createCreatureFromTrack);

    users[spotifyId] = { spotifyId, creatures };
    saveUsers(users);
  }

  res.json(users[spotifyId].creatures);
};

export const getUserCreaturesController = (
  req: Request,
  res: Response,
): void => {
  const spotifyId = (req as any).spotifyId as string;
  if (!spotifyId) {
    res.status(400).json({ error: "Spotify ID missing" });
    return;
  }

  const users = readUsers();
  const user = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user.creatures);
};

export const addUserCreaturesFromSongs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token = (req as any).spotifyToken as string;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  const user = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const songs = await getUserTopTracks(token, 50);
  const newCreatures = songs.map(createCreatureFromTrack);

  const existingIds = new Set(user.creatures.map((c) => c.id));
  newCreatures.forEach((c) => {
    if (!existingIds.has(c.id)) user.creatures.push(c);
  });

  saveUsers(users);
  res.json(user.creatures);
};

export const addSingleCreature = async (req: Request, res: Response): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string ?? process.env.FALLBACK_SPOTIFY_ID;
  const token = (req as any).spotifyToken as string;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  const user = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Fetch more tracks than we have creatures, pick one we don't have yet
  const songs = await getUserTopTracks(token, 50);
  const existingIds = new Set(user.creatures.map(c => c.id));
  const newSong = songs.find(s => !existingIds.has(s.id));

  if (!newSong) {
    res.status(400).json({ error: "No new songs to generate a creature from" });
    return;
  }

  const creature = createCreatureFromTrack(newSong);

  user.creatures.push(creature);
  saveUsers(users);

  res.json(creature); // returns just the new one
};


export const getTrackPreview = async (req: Request, res: Response): Promise<void> => {
  const token  = (req as any).spotifyToken as string;
  const { songId } = req.params;

  try {
    // track details from Spotify
    const spotifyRes = await axios.get(`https://api.spotify.com/v1/tracks/${songId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const track = spotifyRes.data;
    const name   = track.name;
    const artist = track.artists[0]?.name ?? "";
    const albumArt = track.album?.images[0]?.url ?? null;

    // look in Deezer for preview
    const deezerRes = await axios.get(`https://api.deezer.com/search`, {
      params: { q: `artist:"${artist}" track:"${name}"`, limit: 1 },
    });
    const deezerTrack = deezerRes.data?.data?.[0];
    const previewUrl = deezerTrack?.preview ?? null;

    res.json({ name, artist, albumArt, previewUrl });
  } catch (err: any) {
    console.error("Track preview error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch track preview" });
  }
};
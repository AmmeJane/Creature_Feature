// src/controllers/userController.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import { CREATURE_TYPES, Creature } from "../types/CreatureTypes";
import { SpotifyTrack } from "../types/SpotifyTypes";
import { User } from "../types/UserTypes";

const DATA_FILE = path.join(__dirname, "../data/users.json");

const STARTING_HERD_SIZE = 2; // creatures given on first load

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
function mapTrack(t: any): SpotifyTrack {
  return {
    id: t.id as string,
    name: t.name as string,
    popularity: t.popularity as number,
    duration_ms: t.duration_ms as number,
    explicit: t.explicit as boolean,
  };
}

async function getUserTopTracks(token: string): Promise<SpotifyTrack[]> {
  const seen = new Set<string>();
  const all: SpotifyTrack[] = [];

  try {
    // Top tracks across 3 time ranges (up to 150)
    for (const range of ["long_term", "medium_term", "short_term"]) {
      const res = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50, time_range: range },
      });
      for (const t of res.data.items) {
        if (!seen.has(t.id)) { seen.add(t.id); all.push(mapTrack(t)); }
      }
    }

    // Recently played (up to 50)
    const rec = await axios.get("https://api.spotify.com/v1/me/player/recently-played", {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50 },
    });
    for (const { track: t } of rec.data.items) {
      if (!seen.has(t.id)) { seen.add(t.id); all.push(mapTrack(t)); }
    }

    // Saved tracks — 2 pages (up to 100 more)
    for (const offset of [0, 50]) {
      const saved = await axios.get("https://api.spotify.com/v1/me/tracks", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50, offset },
      });
      for (const { track: t } of saved.data.items) {
        if (!seen.has(t.id)) { seen.add(t.id); all.push(mapTrack(t)); }
      }
    }
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data || err.message : String(err);
    console.error("Spotify API error:", msg);
  }

  return all;
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
function createCreatureFromTrack(song: SpotifyTrack): Creature {
  const size = song.popularity / 100;
  const durationNorm = Math.min(
    Math.max((song.duration_ms - 90_000) / (300_000 - 90_000), 0),
    1,
  );
  const speed = 1 - durationNorm;
  const colour = song.popularity / 100;

  return {
    id: song.id,
    songId: song.id,
    name: `${song.name} Beast`,
    type: pickWeightedType(),
    genes: { size, speed, colour },
  };
}

// Shuffle an array in place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----- INIT USER -----
// Fetches full song pool, stores it, creates starting herd from random subset
async function initUser(spotifyId: string, token: string): Promise<User> {
  const songs = await getUserTopTracks(token);
  const shuffled = shuffle([...songs]);

  // Store all song ids as the pool
  const songPool = shuffled.map(s => s.id);

  // Create starting herd from first N shuffled songs
  const startingSongs = shuffled.slice(0, STARTING_HERD_SIZE);
  const creatures = startingSongs.map(createCreatureFromTrack);

  // Mark used songs so spawn doesn't repeat them
  const usedSongIds = new Set(startingSongs.map(s => s.id));
  const remainingPool = songPool.filter(id => !usedSongIds.has(id));

  return { spotifyId, creatures, songPool: remainingPool };
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
    users[spotifyId] = await initUser(spotifyId, token);
    saveUsers(users);
  }

  res.json(users[spotifyId].creatures);
};

export const getUserCreaturesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token = (req as any).spotifyToken as string;

  if (!spotifyId) {
    res.status(400).json({ error: "Spotify ID missing" });
    return;
  }

  const users = readUsers();

  if (!users[spotifyId]) {
    users[spotifyId] = await initUser(spotifyId, token);
    saveUsers(users);
  }

  res.json(users[spotifyId].creatures);
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

  // Pick next song from stored pool
  const pool: string[] = user.songPool ?? [];

  if (pool.length === 0) {
    // Pool exhausted — refetch and rebuild (excluding already owned creatures)
    const songs = await getUserTopTracks(token);
    const existingIds = new Set(user.creatures.map(c => c.id));
    const fresh = shuffle(songs.filter(s => !existingIds.has(s.id)));

    if (fresh.length === 0) {
      res.status(400).json({ error: "No new songs to generate a creature from" });
      return;
    }

    user.songPool = fresh.slice(1).map(s => s.id);
    const creature = createCreatureFromTrack(fresh[0]);
    user.creatures.push(creature);
    saveUsers(users);
    res.json(creature);
    return;
  }

  // Pop from front of pool, fetch that track's details from Spotify
  const nextId = pool.shift()!;
  user.songPool = pool;

  // We need full track details — fetch from Spotify
  let creature: Creature;
  try {
    const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${nextId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const song = mapTrack(trackRes.data);
    creature = createCreatureFromTrack(song);
  } catch {
    // If fetch fails, create a minimal creature from just the id
    creature = createCreatureFromTrack({
      id: nextId,
      songId: nextId,
      name: "Mystery Beast",
      popularity: 50,
      duration_ms: 180_000,
      explicit: false,
    } as any);
  }

  user.creatures.push(creature);
  saveUsers(users);
  res.json(creature);
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

  const songs = await getUserTopTracks(token);
  const existingIds = new Set(user.creatures.map((c) => c.id));
  songs.forEach((s) => {
    if (!existingIds.has(s.id)) user.creatures.push(createCreatureFromTrack(s));
  });

  saveUsers(users);
  res.json(user.creatures);
};

export const getTrackPreview = async (req: Request, res: Response): Promise<void> => {
  const token  = (req as any).spotifyToken as string;
  const { songId } = req.params;

  try {
    const spotifyRes = await axios.get(`https://api.spotify.com/v1/tracks/${songId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const track = spotifyRes.data;
    const name     = track.name;
    const artist   = track.artists[0]?.name ?? "";
    const albumArt = track.album?.images[0]?.url ?? null;

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

export const getSpotifyProfile = async (req: Request, res: Response): Promise<void> => {
  const token = (req as any).spotifyToken as string;
  const res2 = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  res.json({ name: res2.data.display_name, image: res2.data.images?.[0]?.url ?? null });
};

export const getNextSong = async (req: Request, res: Response): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token     = (req as any).spotifyToken as string;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  const user  = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const pool: string[] = user.songPool ?? [];
  if (pool.length === 0) {
    res.status(400).json({ error: "Song pool is empty" });
    return;
  }

  // Loop through pool until we find a song with a Deezer preview
  for (let i = 0; i < pool.length; i++) {
    const candidateId = pool[i];
    try {
      const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const track  = trackRes.data;
      const name   = track.name as string;
      const artist = track.artists[0]?.name ?? "";

      const deezerRes = await axios.get(`https://api.deezer.com/search`, {
        params: { q: `artist:"${artist}" track:"${name}"`, limit: 1 },
      });
      const deezerTrack = deezerRes.data?.data?.[0];
      const previewUrl  = deezerTrack?.preview ?? null;

      if (!previewUrl) {
        console.log(`No preview for "${name}", skipping…`);
        continue;
      }

      // Move this song to front of pool so addSingleCreature uses it next
      user.songPool = [candidateId, ...pool.filter((_, idx) => idx !== i)];
      saveUsers(users);

      res.json({ songId: candidateId, name, artist, previewUrl });
      return;
    } catch (err: any) {
      console.error("getNextSong error:", err.response?.data || err.message);
      continue;
    }
  }

  res.status(404).json({ error: "No songs with previews found in pool" });
};

export const getHeardleSong = async (req: Request, res: Response): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token     = (req as any).spotifyToken as string;
  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  const user  = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Pool = all creatures the user has, in random order each time
  const creatures = user.creatures ?? [];
  if (creatures.length === 0) {
    res.status(400).json({ error: "No creatures to guess from" });
    return;
  }

  // Shuffle and find one with a Deezer preview
  const shuffled = [...creatures].sort(() => Math.random() - 0.5);

  for (const creature of shuffled) {
    try {
      const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${creature.songId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const track  = trackRes.data;
      const name   = track.name as string;
      const artist = track.artists[0]?.name ?? "";

      const deezerRes = await axios.get(`https://api.deezer.com/search`, {
        params: { q: `artist:"${artist}" track:"${name}"`, limit: 1 },
      });
      const deezerTrack = deezerRes.data?.data?.[0];
      const previewUrl  = deezerTrack?.preview ?? null;
      if (!previewUrl) continue;

      res.json({
        songId:       creature.songId,
        name,
        artist,
        previewUrl,
        creature,
        creatureType: creature.type,
      });
      return;
    } catch (err: any) {
      console.error("getHeardleSong error:", err.response?.data || err.message);
      continue;
    }
  }

  res.status(404).json({ error: "No songs with previews found" });
};

export const addCreatureBySpotifyId = async (req: Request, res: Response): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token     = (req as any).spotifyToken as string;
  const { songId } = req.body;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }
  if (!songId) {
    res.status(400).json({ error: "songId missing from body" });
    return;
  }

  const users = readUsers();
  const user  = users[spotifyId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Don't add duplicates
  if (user.creatures.find(c => c.id === songId)) {
    res.json(user.creatures.find(c => c.id === songId));
    return;
  }

  try {
    const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${songId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const song: SpotifyTrack = {
      id:          trackRes.data.id,
      name:        trackRes.data.name,
      popularity:  trackRes.data.popularity,
      duration_ms: trackRes.data.duration_ms,
      explicit:    trackRes.data.explicit,
    };
    const creature = createCreatureFromTrack(song);
    user.creatures.push(creature);
    saveUsers(users);
    res.json(creature);
  } catch (err: any) {
    console.error("addCreatureBySpotifyId error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch track from Spotify" });
  }
};
// src/controllers/userController.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import axios, { AxiosResponse } from "axios";

const DATA_FILE = path.join(__dirname, "../data/users.json");

// ----- TYPES -----
interface Creature {
  id: string;
  songId: string;
  name: string;
  genes: { size: number; speed: number; colour: number };
}

interface User {
  spotifyId: string;
  creatures: Creature[];
}

interface SpotifyTrack {
  id: string;
  name: string;
}

interface AudioFeatures {
  id: string;
  danceability: number;
  tempo: number;
  valence: number;
}

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
async function getUserTopTracks(token: string, limit = 5): Promise<SpotifyTrack[]> {
  try {
    const res: AxiosResponse<{ items: any[] }> = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, time_range: "long_term" },
      }
    );

    return res.data.items.map((t) => ({ id: t.id as string, name: t.name as string }));
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data || err.message : String(err);
    console.error("Spotify API error (top tracks):", msg);
    return [];
  }
}

async function getAudioFeatures(token: string, trackIds: string[]): Promise<Record<string, AudioFeatures>> {
  const featuresMap: Record<string, AudioFeatures> = {};
  if (!trackIds.length) return featuresMap;

  const batchSize = 100;
  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batch = trackIds.slice(i, i + batchSize);
    try {
      const res: AxiosResponse<{ audio_features: AudioFeatures[] }> = await axios.get(
        "https://api.spotify.com/v1/audio-features",
        { headers: { Authorization: `Bearer ${token}` }, params: { ids: batch.join(",") } }
      );

      res.data.audio_features.forEach(f => { if (f) featuresMap[f.id] = f; });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data || err.message : String(err);
      console.error("Spotify API error (audio features):", msg);
    }
  }

  console.log("Fetched audio features:", featuresMap);
  return featuresMap;
}
// ----- CREATE CREATURE -----
function createCreatureFromSongWithFeatures(song: SpotifyTrack, features?: AudioFeatures): Creature {
  if (!features) {
    return {
      id: song.id,
      songId: song.id,
      name: `${song.name} Beast`,
      genes: { size: 0.5, speed: 0.5, colour: 0.5 },
    };
  }

  // Map Spotify traits directly to creature genes
  const size = features.danceability;               // danceability → size
  const speed = (features.tempo - 50) / (200 - 50); // tempo normalized 50–200 BPM → 0–1
  const colour = features.valence;                 // valence → colour (0–1)

  return {
    id: song.id,
    songId: song.id,
    name: `${song.name} Beast`,
    genes: { size, speed, colour },
  };
}

// ----- CONTROLLERS -----
export const createUserAndGenerateCreatures = async (req: Request, res: Response): Promise<void> => {
  const spotifyId = (req as any).spotifyId as string;
  const token = (req as any).spotifyToken as string;

  if (!spotifyId || !token) {
    res.status(400).json({ error: "Spotify ID or token missing" });
    return;
  }

  const users = readUsers();
  if (!users[spotifyId]) {
    const songs = await getUserTopTracks(token, 5);
    const featuresMap = await getAudioFeatures(token, songs.map((s) => s.id));

    const creatures = songs.map((song) =>
      createCreatureFromSongWithFeatures(song, featuresMap[song.id])
    );

    users[spotifyId] = { spotifyId, creatures };
    saveUsers(users);
  }

  res.json(users[spotifyId].creatures);
};

export const getUserCreaturesController = (req: Request, res: Response): void => {
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

export const addUserCreaturesFromSongs = async (req: Request, res: Response): Promise<void> => {
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
  const featuresMap = await getAudioFeatures(token, songs.map((s) => s.id));

  const newCreatures = songs.map((s) => createCreatureFromSongWithFeatures(s, featuresMap[s.id]));

  const existingIds = new Set(user.creatures.map((c) => c.id));
  newCreatures.forEach((c) => {
    if (!existingIds.has(c.id)) user.creatures.push(c);
  });

  saveUsers(users);
  res.json(user.creatures);
};
import { Request, Response, NextFunction } from "express";
import { getUserToken } from "../services/tokenStore";
import axios from "axios";

export const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getUserToken();

    if (!token) {
      return res.status(401).json({ error: "No Spotify token stored. Login first." });
    }

    // store the token for later use if needed
    (req as any).spotifyToken = token;

    // fetch Spotify profile to get Spotify ID
    const profileRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    (req as any).spotifyId = profileRes.data.id;

    next();
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify Spotify token" });
  }
};
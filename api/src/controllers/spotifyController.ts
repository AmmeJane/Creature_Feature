import { Request, Response } from "express";
import { getUserTopTracks } from "../services/spotifyService";

export const getTop50 = async (req: Request, res: Response) => {
  const token = (req as any).spotifyToken;

  try {
    const tracks = await getUserTopTracks(token);
    res.json(tracks);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch top tracks");
  }
};
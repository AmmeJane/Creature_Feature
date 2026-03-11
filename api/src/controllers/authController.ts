import { Request, Response } from "express";
import { exchangeCodeForToken } from "../services/spotifyService";
import { setUserToken, clearUserToken } from "../services/tokenStore";

export const login = (req: Request, res: Response) => {
  const scope = [
    "user-top-read",
    "user-read-recently-played",
    "user-library-read"
  ].join(" ");

  const state = Math.random().toString(36).substring(2);
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI!)}&state=${state}&show_dialog=true`;

  res.redirect(authUrl);
};

export const callback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code received from Spotify");

  try {
    const token = await exchangeCodeForToken(code, process.env.REDIRECT_URI!, process.env.SPOTIFY_CLIENT_ID!, process.env.SPOTIFY_CLIENT_SECRET!);
    setUserToken(token);
    res.redirect("http://localhost:5173/");
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to exchange code for token.");
  }
};

export const logout = (req: Request, res: Response) => {
  clearUserToken();
  res.redirect(`http://localhost:3000/auth/login?show_dialog=true`);
};
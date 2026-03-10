import axios from "axios";

export const exchangeCodeForToken = async (code: string, redirectUri: string, clientId: string, clientSecret: string) => {
  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
    }
  );
  return res.data.access_token;
};

export const getUserTopTracks = async (token: string) => {
  const res = await axios.get("https://api.spotify.com/v1/me/tracks?limit=50", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.items;
};
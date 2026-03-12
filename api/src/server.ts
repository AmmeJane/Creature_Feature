import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { checkToken } from "./middleware/checkToken";

import authRoutes from "./routes/authRoutes";
import spotifyRoutes from "./routes/spotifyRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", checkToken, spotifyRoutes);
app.use("/api/user", checkToken, userRoutes);


app.listen(port, () => console.log(`Server running on http://localhost:${port}, visit http://localhost:${port}/auth/login then http://localhost:${port}/api/top50 or http://localhost:${port}/api/user`, ));
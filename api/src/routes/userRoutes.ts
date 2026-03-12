import { Router } from "express";
import { createUserAndGenerateCreatures, getUserCreaturesController, addSingleCreature, getTrackPreview, getSpotifyProfile, getHeardleSong, addCreatureBySpotifyId } from "../controllers/userController";
import { getNextSong } from "../controllers/userController";

const router = Router();

router.get("/", createUserAndGenerateCreatures);
router.get("/creatures", getUserCreaturesController);
router.post("/creatures/add", addSingleCreature);
router.get("/track/:songId", getTrackPreview);
router.get("/profile", getSpotifyProfile);
router.get("/next-song", getNextSong);
router.get("/heardle-song", getHeardleSong);
router.post("/creatures/add-by-song", addCreatureBySpotifyId);

export default router;
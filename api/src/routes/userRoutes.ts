import { Router } from "express";
import { createUserAndGenerateCreatures, getUserCreaturesController, addSingleCreature, getTrackPreview } from "../controllers/userController";

const router = Router();

router.get("/", createUserAndGenerateCreatures);
router.get("/creatures", getUserCreaturesController);
router.post("/creatures/add", addSingleCreature);
router.get("/track/:songId", getTrackPreview);

export default router;
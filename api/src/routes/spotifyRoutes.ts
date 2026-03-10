import { Router } from "express";
import { getTop50 } from "../controllers/spotifyController";


const router = Router();

router.get("/top50", getTop50);

export default router;
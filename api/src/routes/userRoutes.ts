import { Router } from "express";
import { createUserAndGenerateCreatures, getUserCreaturesController } from "../controllers/userController";

const router = Router();

router.get("/", createUserAndGenerateCreatures);
router.get("/creatures", getUserCreaturesController);

export default router;
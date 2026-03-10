import { Router } from "express";
import { createUserAndGenerateCreatures, getUserCreaturesController, addSingleCreature } from "../controllers/userController";

const router = Router();

router.get("/", createUserAndGenerateCreatures);
router.get("/creatures", getUserCreaturesController);
router.post("/creatures/add", addSingleCreature);

export default router;
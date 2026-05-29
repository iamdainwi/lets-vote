import { Router } from "express";
import {
    createPollHandler,
    getPollHandler,
    voteHandler,
    sseStreamHandler,
} from "../controllers/poll.controller.js";

const router = Router();

router.post("/", createPollHandler);
router.get("/:id", getPollHandler);
router.post("/:id/vote", voteHandler);
router.get("/:id/stream", sseStreamHandler);

export default router;

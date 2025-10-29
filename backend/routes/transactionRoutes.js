import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { criarTransacao } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/nova", protect, criarTransacao);

export default router;

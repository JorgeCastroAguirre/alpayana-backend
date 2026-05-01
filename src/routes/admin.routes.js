import express from "express";
import { LoginAdmin } from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/admin.js";
import {upload} from "../middleware/upload.js";
import {subirExcel, subirExcelUsuarios} from "../controllers/excel.controller.js";

const router = express.Router();

// 🔓 login (público)
router.post("/login", LoginAdmin);

// 🔐 ruta protegida
router.get("/protegido", verifyToken, (req, res) => {
  res.json({
    message: "Acceso permitido",
    user: req.user
  });
});

// 📊 subir Excel (solo admin)
router.post("/subir-excel", verifyToken, upload.single("archivo"), subirExcel);

// 👥 subir/actualizar usuarios
router.post("/subir-usuarios", verifyToken, upload.single("archivo"), subirExcelUsuarios);

export default router;
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

export const LoginAdmin = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // 1. Buscar admin en la base de datos
    const [rows] = await pool.query(
      "SELECT * FROM admin WHERE usuario = ?",
      [usuario]
    );

    // Si no existe el usuario
    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const admin = rows[0];

    // 2. Comparar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, admin.password);

    if (!passwordValida) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // 3. Generar token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        usuario: admin.usuario
      },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "1h" }
    );

    // 4. Respuesta exitosa
    res.json({
      message: "Login exitoso",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
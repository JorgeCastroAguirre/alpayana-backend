import {pool} from "../db.js";

export const consultarPorDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    // 1️⃣ buscar en tabla usuarios
    const [usuario] = await pool.query(
      "SELECT * FROM usuarios WHERE dni = ?",
      [dni]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ message: "DNI no encontrado" });
    }

    // 2️⃣ verificar situación
    if (usuario[0].situacion?.toUpperCase() === "CESADO") {
      return res.status(403).json({ message: "CESADO" });
    }

    // 3️⃣ buscar su planilla en tabla registro
    const [registros] = await pool.query(
      "SELECT * FROM registro WHERE dni = ?",
      [dni]
    );

    res.json({
      usuario: usuario[0],
      registros,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al consultar" });
  }
};


import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // 📌 el token viene del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No hay token" });
    }

    // 🔥 en frontend lo mandas como: Authorization: token
    const token = authHeader;

    // 🔐 verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secreto"
    );

    // 📦 guardar datos del usuario en req
    req.user = decoded;

    next(); // continúa a la ruta

  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
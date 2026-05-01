import bcrypt from "bcrypt";

const generar = async () => {
  const passwordPlano = "9137";
  const hash = await bcrypt.hash(passwordPlano, 10);

  console.log("HASH GENERADO:", hash);
};

generar();
import * as XLSX from "xlsx";
import { pool } from "../db.js";

const COLUMNAS_REGISTRO = [
  "AÑO", "MES", "DNI", "DIAS LIBRES",
  "VACACIONES VENCIDAS", "VACACIONES PENDIENTES",
  "VACACIONES TRUNCAS", "TOTAL DE VACACIONES ACUMULADAS"
];

const COLUMNAS_USUARIOS = [
  "DNI", "NOMBRE COMPLETO", "SITUACION", "CLAVE DE SEXO"
];

const limpiarColumnas = (datos) => {
  return datos.map(fila => {
    const nuevaFila = {};
    for (const key in fila) {
      nuevaFila[key.trim().toUpperCase()] = fila[key];
    }
    return nuevaFila;
  });
};

const verificarColumnas = (datos, columnasRequeridas) => {
  if (datos.length === 0) return ["El archivo está vacío"];

  const columnasArchivo = Object.keys(datos[0]);
  const faltantes = columnasRequeridas.filter(col => !columnasArchivo.includes(col));

  if (faltantes.length > 0) {
    return [`Columnas incorrectas o mal escritas. Faltantes: ${faltantes.join(", ")}`];
  }

  return [];
};

const verificarFilas = (datos, columnasRequeridas) => {
  const errores = [];

  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const fila_num = i + 2;
    const camposVacios = columnasRequeridas.filter(
      col => fila[col] === undefined || fila[col] === null || fila[col] === ""
    );

    if (camposVacios.length > 0) {
      errores.push(`Fila ${fila_num}: campos vacíos → ${camposVacios.join(", ")}`);
    }
  }

  return errores;
};

// 📊 subir planilla mensual
export const subirExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // verificar que sea excel válido
    let datos;
    try {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      datos = XLSX.utils.sheet_to_json(hoja);
    } catch {
      return res.status(400).json({
        message: "El archivo no es un Excel válido (.xlsx o .xls)"
      });
    }

    const datosLimpios = limpiarColumnas(datos);

    // verificar columnas
    const erroresColumnas = verificarColumnas(datosLimpios, COLUMNAS_REGISTRO);
    if (erroresColumnas.length > 0) {
      return res.status(400).json({
        message: "El archivo tiene columnas incorrectas",
        errores: erroresColumnas
      });
    }

    // verificar filas vacías — si hay errores no inserta nada
    const erroresFilas = verificarFilas(datosLimpios, COLUMNAS_REGISTRO);
    if (erroresFilas.length > 0) {
      return res.status(400).json({
        message: "Se encontraron campos vacíos, no se insertó ningún registro",
        errores: erroresFilas
      });
    }

    // todo ok → insertar
    for (const fila of datosLimpios) {
      await pool.query(
        `INSERT INTO registro (anio, mes, dni, dias_libres, vacaciones_vencidas, vacaciones_pendientes, vacaciones_truncas, total_vacaciones_acumuladas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fila["AÑO"],
          fila["MES"],
          fila["DNI"],
          fila["DIAS LIBRES"],
          fila["VACACIONES VENCIDAS"],
          fila["VACACIONES PENDIENTES"],
          fila["VACACIONES TRUNCAS"],
          fila["TOTAL DE VACACIONES ACUMULADAS"],
        ]
      );
    }

    res.json({ message: `${datosLimpios.length} registros insertados correctamente` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar el Excel" });
  }
};

// 👥 subir/actualizar usuarios
export const subirExcelUsuarios = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // verificar que sea excel válido
    let datos;
    try {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      datos = XLSX.utils.sheet_to_json(hoja);
    } catch {
      return res.status(400).json({
        message: "El archivo no es un Excel válido (.xlsx o .xls)"
      });
    }

    const datosLimpios = limpiarColumnas(datos);

    // verificar columnas
    const erroresColumnas = verificarColumnas(datosLimpios, COLUMNAS_USUARIOS);
    if (erroresColumnas.length > 0) {
      return res.status(400).json({
        message: "El archivo tiene columnas incorrectas",
        errores: erroresColumnas
      });
    }

    // verificar filas vacías — si hay errores no inserta nada
    const erroresFilas = verificarFilas(datosLimpios, COLUMNAS_USUARIOS);
    if (erroresFilas.length > 0) {
      return res.status(400).json({
        message: "Se encontraron campos vacíos, no se actualizó ningún registro",
        errores: erroresFilas
      });
    }

    // verificar que SITUACION sea solo ACTIVO o CESADO
    const erroresSituacion = [];
    datosLimpios.forEach((fila, i) => {
      const situacion = fila["SITUACION"]?.toString().toUpperCase();
      if (!["ACTIVO", "CESADO"].includes(situacion)) {
        erroresSituacion.push(
          `Fila ${i + 2}: SITUACION inválida → "${fila["SITUACION"]}" (debe ser ACTIVO o CESADO)`
        );
      }
    });

    if (erroresSituacion.length > 0) {
      return res.status(400).json({
        message: "Se encontraron valores inválidos en SITUACION, no se actualizó ningún registro",
        errores: erroresSituacion
      });
    }

    // todo ok → insertar/actualizar
    for (const fila of datosLimpios) {
      await pool.query(
        `INSERT INTO usuarios (dni, nombre_completo, situacion, sexo)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre_completo = VALUES(nombre_completo),
           situacion = VALUES(situacion),
           sexo = VALUES(sexo)`,
        [
          fila["DNI"],
          fila["NOMBRE COMPLETO"],
          fila["SITUACION"].toString().toUpperCase(),
          fila["CLAVE DE SEXO"],
        ]
      );
    }

    res.json({ message: `${datosLimpios.length} trabajadores actualizados correctamente` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar el Excel de usuarios" });
  }
};
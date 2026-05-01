import "dotenv/config"
import express from 'express'
import cors from 'cors'
import adminRoutes from './routes/admin.routes.js'
import usuarioRoutes from './routes/usuario.routes.js' 

const app=express()

app.use(cors())
app.use(express.json())

//llamado de la carpeta routes
app.use("/api/admin",adminRoutes)
app.use("/api/usuario",usuarioRoutes)

const PORT= process.env.PORT || 3000;

app.listen(3000)
console.log('Server on port', PORT)

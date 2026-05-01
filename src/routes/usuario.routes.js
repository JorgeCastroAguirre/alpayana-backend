import {Router} from 'express'
import {consultarPorDNI} from '../controllers/usuario.controller.js'

const router=Router()

// 👤 consultar por DNI (público, cualquier usuario)
router.get("/consultar/:dni", consultarPorDNI);

export default router
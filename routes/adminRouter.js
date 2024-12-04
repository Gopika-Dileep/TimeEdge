const express = require("express");
const router = express.Router()
const adminController = require("../controllers/admin/adminController")



router.get("/",adminController.loadAdminLogin);







module.exports = router;
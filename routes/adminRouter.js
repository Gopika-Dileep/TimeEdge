const express = require("express");
const router = express.Router()
const adminController = require("../controllers/admin/adminController")



router.get("/",adminController.loadAdminLogin);
router.post("/",adminController.login);
router.get("/dashboard",adminController.loadDashboard)






module.exports = router;
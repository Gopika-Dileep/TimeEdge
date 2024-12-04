const express = require("express");
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const {userAuth,adminAuth} = require("../middlewares/auth");


router.get("/pageerror",adminController.pageerror)
router.get("/",adminController.loadAdminLogin);
router.post("/",adminController.login);
router.get("/dashboard",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout);





module.exports = router;
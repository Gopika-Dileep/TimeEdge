const express = require("express");
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController");
const {userAuth,adminAuth} = require("../middlewares/auth");


router.get("/pageerror",adminController.pageerror)
router.get("/",adminController.loadAdminLogin);
router.post("/",adminController.login);
router.get("/dashboard",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout);
router.get("/user-block/:userId",customerController.blockUser)
router.get("/user-unblock/:userId",customerController.unblockUser)
router.get("/users",adminAuth,customerController.customerInfo);

// router.get("/category",adminAuth,adminController.category);
// router.post("/addCategory",adminAuth,adminController.addCategory);

//Category Management.....................
router.get("/category", adminAuth, adminController.category);
router.post("/addCategory", adminAuth, adminController.addCategory);
router.get("/listCategory", adminAuth, adminController.getUnlistedCategory);
router.get("/unlistCategory", adminAuth,adminController.getListedCategory);
router.get("/editCategory",adminAuth,adminController.getEditCategory)
router.post("/editCategory/:categoryId",adminAuth,adminController.editCategory);

// router.get("/addProduct", adminAuth, adminController.addProduct);


module.exports = router;
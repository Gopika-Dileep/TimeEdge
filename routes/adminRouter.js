const express = require("express");
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
const {userAuth,adminAuth} = require("../middlewares/auth");
const multer = require("multer");
// const storage = require("../helpers/multer");
const upload =require("../helpers/multer")

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
router.get("/category", adminAuth, categoryController.category);
router.post("/addCategory", adminAuth, categoryController.addCategory);
router.get("/listCategory", adminAuth, categoryController.getUnlistedCategory);
router.get("/unlistCategory", adminAuth,categoryController.getListedCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory)
router.post("/editCategory/:categoryId",adminAuth,categoryController.editCategory);



//Brand Management.........................
router.get("/brands",adminAuth,brandController.getBrandPage);
router.post("/addBrand",adminAuth,upload.single("image"),brandController.addBrand);


router.post('/blockBrand/:id', brandController.blockBrand);
router.post("/unblockBrand/:id", adminAuth, brandController.unblockBrand);
router.get("/deleteBrand",adminAuth,brandController.deleteBrand)
// product management

router.get("/addProducts",adminAuth,productController.getProductAddPage)
router.post("/addProducts",adminAuth,upload.array("images",4),productController.addProducts);
router.get("/products",adminAuth,productController.getAllProducts);

router.get("/listProduct",adminAuth,productController.listProduct);
router.get("/unlistProduct",adminAuth,productController.unlistProduct);

module.exports = router;
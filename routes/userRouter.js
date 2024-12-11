const express = require ("express");
const router = express.Router();
const userController = require ("../controllers/user/userController")
const passport = require('passport')
const profileController = require('../controllers/user/profileController')
const productController = require("../controllers/user/productController");


router.get("/pageNotFound",userController.pageNotFound);
router.get ("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup);
router.post('/signup',userController.signup);
router.get('/verifyotp',userController.loadVerifyOtp)
router.post("/verifyotp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/signup" }),
    (req, res) => {
      console.log("Google callback reached"); 
      res.redirect("/");
    }
  );

  router.get('/login',userController.loadLogin);
  router.post('/login',userController.login);
  

  router.get("/logout",userController.logout);
  router.get("/shop",userController.loadShoppingPage);
  router.get('/filter',userController.filterProduct)
  router.get ('/filterPrice',userController.filterByPrice);


router.get("/forgot-password",profileController.getForgotPassPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/verify-passForgot-otp",profileController.verifyForgotPassOtp)
router.get("/reset-password",profileController.getResetPassPage)
router.post("/resend-forgot-otp",profileController.resendOtp);
router.post("/reset-password",profileController.postNewPassword)


router.get("/productDetails",productController.productDetails);


module.exports = router;
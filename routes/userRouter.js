const express = require ("express");
const router = express.Router();
const userController = require ("../controllers/user/userController")
const passport = require('passport')
const profileController = require('../controllers/user/profileController')
const productController = require("../controllers/user/productController");
const {userAuth,adminAuth} = require("../middlewares/auth");


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
  router.get('/filterPriceRange',userController.filterByPriceRange)





router.get("/forgot-password",profileController.getForgotPassPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/verify-passForgot-otp",profileController.verifyForgotPassOtp)
router.get("/reset-password",profileController.getResetPassPage)
router.post("/resend-forgot-otp",profileController.resendOtp);
router.post("/reset-password",profileController.postNewPassword);




router.get("/profile",userAuth,profileController.userProfile);
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changeEmailValid)
router.post("/verify-email-otp",userAuth,profileController.verifyEmailOtp);
router.post("/update-email",userAuth,profileController.updateEmail);
router.get('/change-password',userAuth,profileController.changePassword)
router.post("/change-password",userAuth,profileController.changePasswordValid);
router.post("/verify-changepassword-otp",userAuth,profileController.verifychangePasswordOtp);




router.get("/addAddress",userAuth,profileController.addAddress);
router.post("/addAddress",userAuth,profileController.postAddAddress);
router.get("/editAddress",userAuth,profileController.editAddress);
router.post("/editAddress",userAuth,profileController.postEditAddress)
router.get("/deleteAddress",userAuth,profileController.deleteAddress)


router.get("/cart",userAuth,userController.addToCart);
router.post("/addToCart",userAuth,userController.postAddToCart);
router.post('/increment',userAuth,userController.incrementQuantity); 
router.post('/decrement',userAuth,userController.decrementQuantity); 
router.post('/remove',userAuth,userController.removeItem); 


router.get("/productDetails",productController.productDetails);


module.exports = router; 
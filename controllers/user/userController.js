const User = require("../../models/userSchema");

const env = require("dotenv").config();
const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt")

const pageNotFound = async(req,res)=>{
    try {
        res.render("page-404")
    }catch (error){
        res.redirect("/pageNotFound")
    }
}




const loadHomepage = async (req,res)=>{
    try {
        const useremail = req.session.user.email;
        
        if(useremail){
            const userData = await User.findOne({email:useremail});
            res.render("home",{user:userData})
        }else{
            return res.render("home");
        }
       
    }catch (error){
        return res.render("home");
       res.status(500).send("server error")
    }
}

const loadSignup = async(req,res)=>{
    try{
        return res.render("signup");
    }catch(error){
        console.log("Home page not loading",error);
        res.status(500).send("Server error");
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();

}
async function sendVerificationEmail(email,otp){
    try {
        
        const transporter = nodemailer.createTransport({
           service:"gmail",
           port:587,
           secure:false,
           requireTLS:true,
           auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
           }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify your account",
            text:`your OTP is ${otp}`,
            html:`<b>Your OTP: ${otp}</b>`
        })
          return info.accepted.length>0
    } catch (error) {
        console.error("Error sending mail",error);
        return false;
        
    }
}

const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", { message: "Email already registered. Please use a different email." });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (!emailSent) {
            return res.render("signup", { message: "Failed to send OTP. Please try again." });
        }

        req.session.userData = { name, email, phone, password, otp };
        console.log("OTP Sent", otp);
        
 res.redirect("/verifyotp");
    } catch (error) {
        console.error("Error in signup:", error);
        return res.render("signup", { message: "An error occurred. Please try again." });
    }
};

const securepassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)

        return passwordHash;
    } catch (error) {
        
    }
}


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const userData = req.session.userData;

        console.log(req.session)

        if (!userData || !userData.otp) {
            return res.render("signup", { message: "Session expired. Please try again." });
        }

        
       
        if (otp !== userData.otp) {
            
            return res.render("verifyotp", { 
                email: userData.email,
                message: "Invalid OTP. Please try again." 
            });
        }

        const hashedPassword = await securepassword(userData.password);
        
        // Create new user
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword
        });

        await newUser.save();
        
        // Clear session data
        delete req.session.userData;
        
        return res.redirect("/");
    } catch (error) {
        console.error("Error verifying OTP:", error);
        if (error.code === 11000) {
            return res.render("signup", { 
                message: "This email is already registered. Please use a different email." 
            });
        }
        return res.render("verifyotp", { 
            email: req.session.userData?.email,
            message: "An error occurred. Please try again." 
        });
    }
};

const loadVerifyOtp = async (req, res) => {
    try {
      if (!req.session.userData) {
        return res.redirect("/signup"); // Redirect if userData is not present in session
      }
  
      res.render("verifyotp", { email: req.session.userData.email });
    } catch (error) {
      console.error("Error loading verify OTP page:", error);
      res.redirect("/pageNotFound");
    }
  };
  

  
const resendOtp = async (req,res)=>{
    console.log('hdhsd')
    try {
        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"EMail not found in session"})

        }
        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("resend otp", otp);
            // res.status(200).json({success:true,message:"OTP Resend Successfully"})
return res.redirect('/verifyotp')
            
        }
    } catch (error) {
        console.error("Error resending OTP",error);
        res.status(500).json({success:false,message:"Internal server Error. please try again"})
    }
}

const loadShopping = async(req,res)=>{
    try{
        return res.render("shop");

    }catch(error){
        console.log("Shopping page not found ", error);
        res.status(500).sed("Server Error");
        
    }
}

const loadLogin = async (req,res)=>{
    try{
        if(!req.session.user){
            return res.render("login",{ message: "" })
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req,res)=>{
    try {
        const {email,password} = req.body
        const findUser = await User.findOne({email:email});
        if(!findUser){
          return res.render("login", {message:"User not found"})

        }
        if(findUser.isBlocked){
            return res.render("login",{message:"User is blocked by admin"})
        }
        const passwordMatch = await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
            return res.render("login",{message:"Incorrect password"})
        }
        req.session.user = findUser._id;
        console.log(req.session.user,'jhgh use')
        res.redirect("/")
    } catch (error) {
        console.error("login error",error);
        res.render("login",{message:"login failed. please try again later"})
    }
}

const logout = async(req,res)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error")
                return res.redirect("/pageNotFound");
            }else{
            return res.redirect("/")
            }
        })

    } catch (error) {
        console.log("Logout error",error);
        res.redirect("/pageNotFound")
    }
}



module.exports ={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    securepassword,
    verifyOtp,
    resendOtp,
    loadLogin ,
    login,
    loadShopping ,
    logout,
    loadVerifyOtp
}
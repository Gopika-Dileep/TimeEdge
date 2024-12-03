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
       return res.render("home");
    }catch (error){
       console.log("home pag enot found");
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
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", { message: "Email already registered. Please use a different email." });
        }

        // Generate and send OTP
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (!emailSent) {
            return res.render("signup", { message: "Failed to send OTP. Please try again." });
        }

        // Store user data and OTP in session
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

        // Hash password before saving
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


module.exports ={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    securepassword,
    verifyOtp,
    resendOtp,
    loadShopping ,
    loadVerifyOtp
}
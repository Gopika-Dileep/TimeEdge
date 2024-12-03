
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
// const signup = async(req,res)=>{
//     const {name,email,phone,password} = req.body;
//     try{
//        const  newUser = new User({name,email,phone,password});
//        await newUser.save();
//        return res.redirect("/signup")
//     }catch(error){
//        console.log("Error for save user", error);
//        res.status(500).send("Internal server error");
//     }
// }

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

// const signup = async (req, res) => {
//     const { name, email, phone, password } = req.body;
//     try {
//         // Check if the email is already registered
//         const findUser = await User.findOne({ email });
//         if (findUser) {
//             // return res.status(400).send("Email is already registered.");
//            return res.render("signup",{message:"user with this email already exists"});
//         }
    
//         // If not, create a new user
//         const newUser = new User({ name, email, phone, password });
//         await newUser.save();

//         return res.redirect("/signup");
//     } catch (error) {
//         console.log("Error for save user", error);

//         // Handle specific MongoDB duplicate key errors
//         if (error.code === 11000) {
//             const key = Object.keys(error.keyPattern)[0]; // e.g., 'email' or 'googleId'
//             return res.status(400).send(`${key} is already in use.`);
//         }

//         // Handle other errors
//         res.status(500).send("Internal server error.");
//     }
// };

const signup = async(req,res)=>{
   
    const {name,email,phone,password} = req.body;
    try {
        const findUser = await User.findOne({email});
        if(findUser){
            return res.render("signup",{message:"User with this email already exists"});

        }
        const newUser = new User({name,email,phone,password});
        await newUser.save();
        
        const otp = generateOtp();
       
        
        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
            return res.json("email.error")
        }
        

        req.session.userOtp = otp;
        req.session.userData = {name,email,phone,password};

         res.render("verifyotp");
         console.log("OTP Sent",otp);
         

    } catch (error) {
        console.error("signup error",error);
        res.redirect("/pageNotFound")
        
    }
}


const securepassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)

        return passwordHash;
    } catch (error) {
        
    }
}


const verifyOtp = async(req,res)=>{
    console.log("hello")
    try {
      const {otp} = req.body  
      console.log("hello",otp);

      if(otp===req.session.userOtp){
        const user = req.session.userData
        const passwordHash = await securepassword(user.password);
     
       const saveUserData = new User({
        name:user.name,
        email:user.email,
        phone:user.phone,
        password:passwordHash
       })
      
       await saveUserData.save();
       req.session.user = saveUserData._id;
       res.json({success:true,redirectUrl:"/"})
     }else{
        res.status(400).json({success:false,message:"Invalid OTP, please try again"});
     }
      
    } catch (error) {
        console.error("Error Verifying OTP",error);
        res.status(500).json({success:false,message:"An error occured"})
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
    loadShopping 
}
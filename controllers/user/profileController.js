const User=require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const { securepassword } = require("./userController");


function generateOtp(){
    const digits = "1234567890";
    let otp = '';
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)];
    }
    return otp;
}
const sendVerificationEmail = async (email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,

            }
        })

        const mailOptions = {
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Your OTP for password reset",
            text:`your OTP is ${otp}`,
            html:`<b><h4>Your OTP: ${otp}</h4><br></b>`
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:",info.messageId);
        return true;

    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}

const securePassword = async (password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    }catch(error){
            
    }
}


const getForgotPassPage = async (req,res)=>{
    try {
        res.render("forgot-password");
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
const forgotEmailValid = async (req,res)=>{
    try {
        const {email} = req.body;
        const findUser = await User.findOne({email:email});
        if(findUser){
            const otp = generateOtp();
            const eamilSent = await sendVerificationEmail(email,otp);
            if(eamilSent){
                req.session.userOtp = otp;
                res.render("forgptPass-otp",{email});
                console.log("OTP:",otp);
            }else{
               res.json({success:false,message:"Failed to send OTP. please try again"}) 
            }
        }else {
            res.render("forgot-password",{
                message:"User with this email does not exist"
            });
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const verifyForgotPassOtp = async (req,res)=>{
    try {
        
        const {otp,email} = req.body;
        console.log(email,'email forgot passwor')
        if(otp === req.session.userOtp){
            res.json({success:true,redirectUrl: `/reset-password?email=${encodeURIComponent(email)}`});

        }else{
            res.json({success:false,message:"OTP not matching"});
        }
    } catch (error) {
        res.status(500).json({success:false,message:"an error occured.Please try again"});

    }
}

const getResetPassPage = async (req,res)=>{
    try {
        res.render("reset-password");

    } catch (error) {
        res.redirect("/pageerror")
    }
}

const resendOtp = async (req,res)=>{
    try {
        const otp = generateOtp();
        req.session.userOtp = otp;
        const {email} = req.body;
        console.log(email,'email')
        console.log("Resending OTP to email:",email);
        const emailSent= await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTP:",otp);
            res.status(200).json({success:true,message:"Resend OTP Successful"})
        }
    } catch (error) {
        console.log("Error in resend otp",error);
        res.status(500).json({success:false , message:"Internal Server Error" });
        
    }
}


const postNewPassword = async (req,res)=>{
    try {
        const {newPassword,confirmPassword} =req.body;
        const email = req.body.email; 
        if(newPassword===confirmPassword){
         const passwordHash = await securePassword(newPassword);
         const user = await User.updateOne( {email:email},
            {$set:{password:passwordHash}}
        )
        
        return res.json({ success: true, redirectUrl: "/login" });

        }else {
            res.render("reset-password",{message:"Passwords do not match"});
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const userProfile = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render('profile',{
            user:userData
        })
    } catch (error) {
        console.error("Error for retrivr profile data",error);
        res.redirect("/pageNotFound");
    }
}
const changeEmail = async (req,res)=>{
    try {
        res.render("change-email")
    } catch (error) {
        console.error("Error in changeEmail:", error); 
        res.redirect("/pageNotFound")
    }
 
}

   
const changeEmailValid = async (req,res)=>{
    try {
        const {email} = req.body;
        const userExists = await User.findOne({email});
        if(userExists){
            const otp = generateOtp();
            const emailSent= await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render("change-email-otp");
                console.log("email sent ",email);
                console.log("OTP",otp);
                
                
            }else{
                res.json("email-error")
            }
        }else{
            res.render("change-email",{
                message :"User with this email not exist"  

            })
        }
    } catch (error) {
        console.log("Error in change password validation", Error);

       res.redirect("/pageNotFound") 
    }
}

const verifyEmailOtp = async (req,res)=>{
    try {
        const enterdOtp = req.body.otp;
        if(enterdOtp===req.session.userOtp){
            req.session.userData = req.body.userData;
            res.render("new-email",{
                userData :req.session.userData,
            })
        }else{
            res.render("change-email-otp",{
                message:"OTP not matching",
                userData : req.session.userData,
            })
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const updateEmail = async(req,res)=>{
    try {
        const newEmail = req.body.newEmail;
        const userId = req.session.user;
        console.log("email",userId);
        const user= await User.findByIdAndUpdate({_id:userId},{$set:{email:newEmail}},{new:true})
        res.redirect("/profile")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const changePassword= async (req,res)=>{
    try {
        res.render('change-password');
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const changePasswordValid = async ( req,res) =>{
    try {
        const {email} = req.body;
        const userExists = await User.findOne({email});
        if(userExists){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render("change-password-otp");
                console.log("OTP:",otp);
                
            }else{
                res.json({
                    success:false,
                    message:"failed to send OTP. Please try again"
                })
            }
            }else{
                res.render("change-password",{
                    message:"User with this email does not exist"
                })
        }

    } catch (error) {
        console.log("Error in change password validation", error);
        res.redirect("/pageNotFound");
    }
}

const verifychangePasswordOtp = async (req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp===req.session.userOtp){
            res.json({success:true,redirectUrl:'/reset-password'})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"an error occured.Please try again later"})
    }
}

module.exports ={
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp ,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    verifychangePasswordOtp
}
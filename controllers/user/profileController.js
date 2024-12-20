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
        const addressData = await Address.findOne({userId : userId})
        res.render('profile',{
            user:userData,
            userAddress:addressData
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

const addAddress = async (req,res)=>{
    try {
        const user = req.session.user;
        res.render('add-address',{user:user})
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const postAddAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findOne({_id:userId});
        const {addressType,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId : userData._id});
        if(!userAddress){
            const newAddress = new Address({
                userId : userData._id,
                address : [{addressType,name,city,landMark,state,pincode,phone,altPhone}]
            });
            await newAddress.save();

        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save();
        }
        res.redirect('/profile')

    } catch (error) {
        console.error('Error adding address;',error);
        res.resirect("/pageNotFound");
    }
}

const editAddress = async (req,res)=>{
    try {
        const addressId = req.query.id;
        console.log( addressId,'type of address')
        const user = req.session.user;
        const currAddress = await Address.findOne({
            "address._id": addressId,
            
        })
        console.log(currAddress,'id fgdf')
        if(!currAddress){
            return res.redirect("/pageNotFound")
        }

        const addressData = currAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString();
        })

        if(!addressData){
            return res.redirect('/pageNotFound')
        }
        res.render("edit-address",{address : addressData, user:user})
    } catch (error) {
        console.error("Error in edit address",error)
        res.redirect("/pageNotFound")
    }
}
const mongoose = require('mongoose');

// const editAddress = async (req, res) => {
//     try {
//         const addressId = req.query.id;
//         if (!addressId) {
//             return res.redirect("/pageNotFound");
//         }
        
//         const user = req.session.user;
        
//         // Convert addressId to ObjectId if needed
//         const objectId = new mongoose.Types.ObjectId(addressId);
//         console.log('objectId',objectId)
        
//         // Find the document containing the address
//         const currAddress = await Address.findOne({
//             "addresses._id": objectId,
//         });
        
//         console.log('addres',currAddress)
//         if (!currAddress || !Array.isArray(currAddress.address)) {
//             return res.redirect("/pageNotFound");
//         }

//         // Find the specific address by ID
//         const addressData = currAddress.addresses.find((item) => {
//             return item._id.toString() === addressId.toString();
//         });

//         if (!addressData) {
//             return res.redirect('/pageNotFound');
//         }

//         res.render("edit-address", { address: addressData, user: user });
//     } catch (error) {
//         console.error("Error in edit address", error);
//         res.redirect("/pageNotFound");
//     }
// };

const postEditAddress = async (req,res)=>{
    try {
        const data = req.body;
        const addressId = req.query.id;
        const user = req.session.user;
        const findAddress = await Address.findOne({"address._id":addressId});
        if(!findAddress){
            res.redirect("/pageNotFound")
        }
        await Address.updateOne({
            "address._id":addressId},
            {$set:{
                "address.$":{
                    id: addressId,
                    addressType : data.addressType,
                    name:data.name,
                    city:data.city,
                    landMark:data.landMark,
                    state:data.state,
                    pincode:data.pincode,
                    phone:data.phone,
                    altPhone:data.altPhone
                }
            }}
        )
        res.redirect("/profile")

    } catch (error) {
        console.error("Error in edit address",error)
        res.redirect("/pageNotFound")
    }
}

const deleteAddress = async (req,res)=>{
    try {
        const addressId= req.query.id;
        const findAddress = await Address.findOne({"address._id": addressId});
        if(!findAddress){
            return res.status(404).send("Address not found")
        }
        await Address.updateOne({
            "address._id":addressId
        },
        {
        $pull:{
            address : {
              _id: addressId,

            }
        }
        }
    )
        res.redirect('/profile')

    } catch (error) {
        
        console.error("/Error in delete address",error)
        res.redirect("/pageNotFound");
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
    verifychangePasswordOtp,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress
}
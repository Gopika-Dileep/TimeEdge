const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Category = require('../../models/categorySchema')



const pageerror = async (req,res)=>{
    res.render("adminerror")
}

const loadAdminLogin = async (req,res)=>{
      if(req.session.admin){
        return res.redirect("/admin/dashboard")
      }else{
        res.render("adminlogin",{message:null})
      }

}

const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch = bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect("/admin")
            }else{
                return res.redirect("/login")
            }
        }else{
            return res.redirect("/login")
        }


    } catch (error) {
        console.log("login error",error);
        return res.redirect("/pageerror")
        
    }
}

const loadDashboard = async (req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashboard");

        } catch (error) {
            res.redirect("/pageerror")
        }
    }
}

const logout = async (req,res)=>{
    try {
        req.session.destroy(err =>{
            if(err){
                console.log("Error desroying session",err);
                return res.redirect("/pageerror")
            }else{
                console.log('back to lgin')
            res.redirect("/admin")
            }
        })
    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/pageerror")
        
    }
}



module.exports = {
    pageerror,
    loadAdminLogin,
    login,
    loadDashboard,
    logout,
}
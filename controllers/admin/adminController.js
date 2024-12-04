const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");




const loadAdminLogin = async (req,res)=>{
      if(req.session.admin){
        return res.redirect("/admin/dashboard")
      }else{
        res.render("adminlogin",{message:null})
      }

}

module.exports = {
    loadAdminLogin
}
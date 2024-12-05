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

const category = async (req,res)=>{
  try{
    const cat = await Category.find()
    return res.render("category",{cat})
  
  }catch(error){
    console.log(error)
  }

}


const addCategory = async (req,res)=>{
    try{
        const {name,description} = req.body;
        console.log(description,'description')

      const cat = await Category({
        name:name,
        description:description
      })
      const categorySave = cat.save()
      return res.redirect("category")
    
    }catch(error){
      console.log(error)
    }
  
  }

  const editCategoryPage = async (req,res)=>{
    try{
        const categoryId = req.query.id;
        const category = await Category.findById({_id:categoryId})
      return res.render("updateCategory",{category:category})
    
    }catch(error){
      console.log(error,'editCategoryPage')
    }
  
  }

  const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { name, description } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name: name || category.name, description: description || category.description },
            { new: true }
        );

        if (updatedCategory) {
            console.log(updatedCategory)
            return res.redirect("category");
        }

        return res.status(500).json({
            success: false,
            message: 'Error updating category'
        });

    } catch (error) {
        console.log(error, 'editCategory');
        return res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
};


//   const editCategory= async (req,res)=>{
//     try{
//         const categoryId = req.params.categoryId;
//         const {name,description} = req.body;
//         const category = await Category.findById({_id:categoryId})
//         const updateCategory = await Category.findByIdAndUpdate({_id:categoryId},{
//             name:name || category.name,
//             description:description || category.description
//         })
//       return res.redirect("category")
    
//     }catch(error){
//       console.log(error,'editCategory')
//     }
  
//   }
module.exports = {
    pageerror,
    loadAdminLogin,
    login,
    loadDashboard,
    logout,
    category,
    addCategory,
    editCategoryPage,
    editCategory
}
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");



// const category = async (req,res)=>{
//   try{
//     const cat = await Category.find()
//     return res.render("category",{cat})
  
//   }catch(error){
//     console.log(error)
//   }

// }

const category = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages,
            totalCategories,
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.redirect("/pageerror");
    }
};


// const addCategory = async (req,res)=>{
//     const {name,description} = req.body;
//     try{
//         if(!name || !description){
//             return res.status(400).json({error:"Name and description are required"});
//         }
//         console.log(description,'description')

//       const cat = await Category({
//         name:name,
//         description:description
//       })
//       const categorySave = cat.save()
//       return res.redirect("category")
    
//     }catch(error){
//       console.log(error)
//     }
  
//   }

const addCategory = async (req, res) => {
    const { name, description } = req.body;

    try {
        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            // return res.status(400).json({ error: "Category already exists" });
            return res.redirect('/category')

        }

        const newCategory = new Category({ name, description });
        await newCategory.save();
        console.log(newCategory,"fffff");
        // res.json({ message: "Category added successfully" });
        return res.redirect('/admin/category')
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const getListedCategory = async (req,res)=>{
    try{
        let id=req.query.id;
        console.log(id)
       
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect("/admin/category")
    }catch(error){
        res.redirect("/pageerror")
    }
}

const getUnlistedCategory=async(req,res)=>{
    try {
        let id = req.query.id;
        console.log(id)
       
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const getEditCategory = async(req,res)=>{
    try{
        const id = req.query.id;
        const category = await Category.findOne({_id:id});
        res.render("editCategory",{category:category});
    }catch{
        res.redirect("/pageerror")
    }
};

// const editCategory = async (req, res) => {
//     try {
//         const id = req.params.id; 
//         const { categoryName, description } = req.body;

//         const existingCategory = await Category.findOne({ name: categoryName });

//         if (existingCategory && existingCategory._id.toString() !== id) {
//             return res.status(400).json({ error: "Category exists, please choose another name" });
//         }

//        const updatedCategory = await Category.findByIdAndUpdate(
//         id,
//         { name: categoryName, description },
//         { new: true, runValidators: true } 
//     );

//     if (!updatedCategory) {
//         return res.status(404).json({ error: "Category not found." }); 
//     }

//     return res.redirect("/admin/category");
// } catch (error) {
//     console.error("Error updating category:", error);
//     return res.status(500).json({ error: "Internal Server Error." }); 
// }
// };
//   const editCategoryPage = async (req,res)=>{
//     try{
//         const categoryId = req.query.id;
//         const category = await Category.findById({_id:categoryId})
//       return res.render("updateCategory",{category:category})
    
//     }catch(error){
//       console.log(error,'editCategoryPage')
//     }
  
//   }

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
    category,
    addCategory,
    getListedCategory,
    getUnlistedCategory,
    getEditCategory,
    editCategory
}
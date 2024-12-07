const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path")
const sharp = require("sharp");
const Category = require("../../models/categorySchema");
const { category } = require("./categoryController");




const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render("product-add", {
            cat: category,
            brand: brand
        });
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const addProducts = async (req, res) => {
    try {
        const products = req.body;

        const productExists = await Product.findOne({
            productName: products.productName
        })
        const images = [];
        if (!productExists) {
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const uploadDir = path.join("public", "uploads", "productImages");
                    const resizedFilename = `resized-${Date.now()}-${req.files[i].filename}`;
                    const resizedImagePath = path.join(uploadDir, resizedFilename);
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);
                    images.push(resizedFilename);
                }
            }
            const categoryId = await Category.findOne({ name: products.category });

            if (!categoryId) {
                return res.status(400).join("Invalid category name")
            }
            console.log(products,'procuts')
            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date,
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: "Available",
            })
            await newProduct.save();
            return res.redirect("/admin/products");
        } else {
            return res.status(400).json("Product  already exist. please try with another name");

        }

    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/pageerror")
    }
}
const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        const query = {
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ]
        };

        const productData = await Product.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('category')
        .exec();
            
        const count = await Product.find(query).countDocuments();

            const category = await Category.find({ isListed: true });
            const brand = await Brand.find({ isBlocked: false });

        if (category && brand) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
            })
        } else {
            res.render("page-404")
        }

    } catch (error) {
        res.redirect('/pageerror');
    }
}


const listProduct = async (req,res)=>{
    try {
      const productId = req.query.id;
      const productUpdate = await Product.findByIdAndUpdate({_id:productId},{isListed:true})
      return res.redirect('/admin/products')
 
    } catch (error) {
          console.error("Error fetching listing product info:", error);
         res.status(500).send("An error occurred while listing product data.");
    }
 }
 const unlistProduct = async (req,res)=>{
     try {
       const productId = req.query.id;
       const productUpdate = await Product.findByIdAndUpdate({_id:productId},{isListed:false})
       return res.redirect('/admin/products')
  
     } catch (error) {
           console.error("Error fetching unlisting product info:", error);
          res.status(500).send("An error occurred while unlisting product data.");
     }
  }
  
 

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    listProduct,
    unlistProduct
}
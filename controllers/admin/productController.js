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

        if (!productExists) {
            const images = [];
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const uploadDir = path.join("public", "uploads", "productImages");
                    const resizedFilename = `resized-${Date.now()}-${req.files[i].filename}`;
                    const resizedImagePath = path.join(uploadDir, resizedFilename);
                    await sharp(originalImagePath)
                        .resize({ width: 1000, height: 1000 })
                        .toFile(resizedImagePath);
                    images.push(resizedFilename);
                }
            }
            const categoryId = await Category.findOne({ name: products.category });
            const brandId = await Brand.findOne({ brandName: products.name });

            if (!categoryId) {
                return res.status(400).join("Invalid category name")
            }
            console.log(products, 'procuts')
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

const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id: findProduct.category });

        if (findCategory.categoryOffer > percentage) {

            return res.json({ status: false, message: "This product's category already has a higher category offer" });
        }


        findProduct.salePrice = Math.floor(findProduct.regularPrice * (1 - percentage / 100));
        findProduct.productOffer = parseInt(percentage);
        await findProduct.save();


        findCategory.categoryOffer = 0;
        await findCategory.save();


        res.json({ status: true });
    } catch (error) {
        console.error("Error in addProductOffer:", error);

        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findOne({ _id: productId });

        const percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.regularPrice;
        findProduct.productOffer = 0;

        await findProduct.save();


        res.json({ status: true });
    } catch (error) {
        console.error("Error in removeProductOffer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};






const listProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const productUpdate = await Product.findByIdAndUpdate({ _id: productId }, { isListed: true }, { new: true })
        return res.redirect('/admin/products')

    } catch (error) {
        console.error("Error fetching listing product info:", error);
        res.status(500).send("An error occurred while listing product data.");
    }
}
const unlistProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const productUpdate = await Product.findByIdAndUpdate({ _id: productId }, { isListed: false }, { new: true })
        return res.redirect('/admin/products')

    } catch (error) {
        console.error("Error fetching unlisting product info:", error);
        res.status(500).send("An error occurred while unlisting product data.");
    }
}

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id });
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render("edit-product", {
            product: product,
            cat: category,
            brand: brand

        })
    } catch (error) {
        res.redirect('/pageerror')
    }
}
//   const editProduct = async (req,res)=>{
//     try {

//        const id = req.params.id;
//        const product = await Product.findOne({_id:id});
//        const data = req.body;
//        const existingProduct = await Product.findOne({
//          productName:data.productName,
//          _id:{$ne:id}
//        })
//        if(existingProduct){
//         return res.status(400).json({error:"product with this name already exists. Please try with another name"});

//        }
//        const images = [];

//        if(req.files && req.files.length>0){
//         for(let i=0;i<req.files.length;i++){
//             images.push(req.files[i].filename);
//         }
//        }

//        const updateFields = {
//          productName: data.productName,
//          description:data.description,
//          brand:data.brand,
//          category:product.category,
//          regularPrice:data.regularPrice,
//          salePrice:data.salePrice,
//          quantity:data.salePrice,
//          size:data.size,
//          color:data.color
//        }
//        if(req.files.length>0){
//           updateFields.$push = {productImage:{$each:images}};
//        }
//        await Product.findByIdAndUpdate(id,updateFields,{new:true})
//        res.redirect("/admin/products");

//     } catch (error) {
//         console.error(error);
//         res.redirect('/pageerror')
//     }
//   }
//  const deleteSingleImage = async (req,res)=>{
//     try { 
//         console.log(req.body,'body')
//         const {imageNameToServer,productIdToServer} = req.body;
//         const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
//         const imagePath = path.join("public","uploads","productImages",imageNameToServer);
//         if(fs.existsSync(imagePath)){
//             await fs.unlinkSync(imagePath);
//             console.log(`Image${imageNameToServer} deleted successfully`)
//         }else{
//             console.log(`Image ${imageNameToServer} not found`);
//         }
//         res.send({status:true});
//     } catch (error) {
//         res.redirect("/pageerror")
//     }
//  }


const editProduct = async (req, res) => {
    try {
        const id = req.params.id
        console.log(id, "req.paramsss")
        const product = await Product.findOne({ _id: id })
        const data = req.body
        const existingProduct = await Product.findOne({
            productName: data.productName,
            id: { $ne: id }

        })

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name" })
        }
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files; i++) {
                images.push(req.files[i].filename)
            }
        }


        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: product.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color
        }

        if (req.files && req.files.length > 0) {
            updateFields.$push = { productImmage: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true })
        res.redirect("/admin/products")
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror")
    }
}


const deleteSingleImage = async (req, res) => {
    try {
        console.log(req.body, 'fdsf');
        const { imageNameToserver, productIdToServer } = req.body;

        console.log(imageNameToserver)
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToserver } })
        const imagePath = path.join("public", "uploads", "productImages", imageNameToserver);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToserver} deleted successfully`);

        } else {
            console.log(`Image ${imageNameToserver} not found`);

        }
        res.send({ status: true })
    } catch (error) {
        console.log(error);

        res.redirect("/pageerror")
    }
}

const updateproduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        
        const categoryDoc = await Category.findOne({ name: data.category });
        
        const categoryId = categoryDoc._id;
        
        const image = [];
        const product = await Product.findById({ _id: id });

        if (Array.isArray(req.files) && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                image.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: data.brand,
            category: categoryId,
            regularPrice: data.regularPrice, 
            salePrice: data.salePrice,
            quantity: data.quantity || product.quantity

        };

        if (image.length > 0) {
            updateFields.$push = { productImage: { $each: image } };
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });
        return res.redirect("/admin/products");
    } catch (error) {
        console.log("edit product error", error);
        return res.redirect("/admin/error");
    }
};




// const updateproduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const product = await Product.findById({ _id: id });
//         const data = req.body;
//         const category = await Category.find({ isListed: true });
//         const brand = await Brand.find({ isBlock: false });


//         const image = [];
//         if (product) {
//             product.productImage = [];
//             await product.save();
//         }
//         if (req.files && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 image.push(req.files[i].filename);
//             }
//         }

//         const updatefilds = {
//             productName: data.productName,
//             description: data.description,
//             brand: data.brand,
//             category: product.category,
//             regularPrice: data.regularPrice,
//             salePrice: data.salePrice,
//             quantity: data.quantity,
//             flavor: data.flavor,
//             size: data.size,
//         }
//         if (req.files.length > 0) {
//             updatefilds.$push = { productImage: { $each: image } };
//         }

//         console.log(updatefilds,'updatefilds')
//         const updatedProduct = await Product.findByIdAndUpdate(id, updatefilds, { new: true });
//         console.log(updatedProduct, 'update ')
//         return res.redirect("/admin/product");
//     } catch (error) {
//         console.log("edit product error", error);
//         return res.redirect("/admin/error");
//     }
// }

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    listProduct,
    unlistProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    updateproduct

}
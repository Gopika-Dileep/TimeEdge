const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");

// const productDetails = async (req,res)=>{
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const productId = req.query.id;
//         const product = await Product.findById(productId).populate('category')
//         const findCategory = product.category;
//         const categoryOffer = findCategory ?.categoryOffer||0;
//         const productOffer = product.productOffer || 0;
//         const totalOffer = categoryOffer+productOffer;
//         if(userId){
//             res.render("product-details",{
//                 user:userData,
//                 product:product,
//                 quantity:product.quantity,
//                 totalOffer:totalOffer,
//                 category:findCategory
//             })
//         }else{
//         res.render("product-details",{
//             product:product,
//             quantity:product.quantity,
//             totalOffer:totalOffer,
//             category:findCategory
//         })
//        }
//     } catch (error) {
//         console.error("Error for ftching product details",error);
//         res.redirect("/pageNotFound")
//     }
// }

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        // Find related products based on category
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId }
        }).limit(5);
        if (userId) {
            res.render("product-details", {
                user: userData,
                product: product,
                quantity: product.quantity,
                totalOffer: totalOffer,
                category: findCategory,
                relatedProducts: relatedProducts
            });
        } else {
            res.render("product-details", {
                product: product,
                quantity: product.quantity,
                totalOffer: totalOffer,
                category: findCategory,
                relatedProducts: relatedProducts
            });
        }
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};




module.exports = {
    productDetails
}
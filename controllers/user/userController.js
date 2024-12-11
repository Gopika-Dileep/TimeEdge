const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Banner = require("../../models/bannerSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt")

const pageNotFound = async (req, res) => {
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}




const loadHomepage = async (req, res) => {
    try {
        const today = new Date().toISOString();
        const findBanner = await Banner.find({
            endDate: { $gt: new Date(today) }
        })
        const userId = req.session.user;
        const categories = await Category.find();

        let productData = await Product.find(
            {
                isListed: false,
                category: { $in: categories.map(category => category._id) }, quantity: { $gt: 0 }
            }
        ).sort({ createdAt: -1 }).limit(4)

        // productData.sort((a,b)=>new Data (b.createdAt)-new Date(a.createdAt));
        // productData = productData.slice(0,4);

        if (userId) {
            const userData = await User.findById({ _id: userId });
            res.render("home", { user: userData, products: productData, banner: findBanner || [] });
        } else {


            return res.render("home", { products: productData, banner: findBanner || [] });
        }

    } catch (error) {
        return res.render("home");
        res.status(500).send("server error")
    }
}

const loadSignup = async (req, res) => {
    try {
        return res.render("signup");
    } catch (error) {
        console.log("Home page not loading", error);
        res.status(500).send("Server error");
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();

}
async function sendVerificationEmail(email, otp) {
    try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        })
        return info.accepted.length > 0
    } catch (error) {
        console.error("Error sending mail", error);
        return false;

    }
}

const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", { message: "Email already registered. Please use a different email." });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.render("signup", { message: "Failed to send OTP. Please try again." });
        }

        req.session.userData = { name, email, phone, password, otp };
        console.log("OTP Sent", otp);

        res.redirect("/verifyotp");
    } catch (error) {
        console.error("Error in signup:", error);
        return res.render("signup", { message: "An error occurred. Please try again." });
    }
};

const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)

        return passwordHash;
    } catch (error) {

    }
}


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const userData = req.session.userData;

        console.log(req.session)

        if (!userData || !userData.otp) {
            return res.render("signup", { message: "Session expired. Please try again." });
        }



        if (otp !== userData.otp) {

            return res.render("verifyotp", {
                email: userData.email,
                message: "Invalid OTP. Please try again."
            });
        }

        const hashedPassword = await securepassword(userData.password);

        // Create new user
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword
        });

        await newUser.save();

        // Clear session data
        delete req.session.userData;

        return res.redirect("/");
    } catch (error) {
        console.error("Error verifying OTP:", error);
        if (error.code === 11000) {
            return res.render("signup", {
                message: "This email is already registered. Please use a different email."
            });
        }
        return res.render("verifyotp", {
            email: req.session.userData?.email,
            message: "An error occurred. Please try again."
        });
    }
};

const loadVerifyOtp = async (req, res) => {
    try {
        if (!req.session.userData) {
            return res.redirect("/signup"); // Redirect if userData is not present in session
        }

        res.render("verifyotp", { email: req.session.userData.email });
    } catch (error) {
        console.error("Error loading verify OTP page:", error);
        res.redirect("/pageNotFound");
    }
};



const resendOtp = async (req, res) => {
    console.log('hdhsd')
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "EMail not found in session" })

        }
        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("resend otp", otp);
            // res.status(200).json({success:true,message:"OTP Resend Successfully"})
            return res.redirect('/verifyotp')

        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).json({ success: false, message: "Internal server Error. please try again" })
    }
}


const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("login", { message: "" })
        } else {
            res.redirect('/')
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const findUser = await User.findOne({ email: email });
        if (!findUser) {
            return res.render("login", { message: "User not found" })

        }
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" })
        }
        const passwordMatch = await bcrypt.compare(password, findUser.password)
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect password" })
        }
        req.session.user = findUser._id;
        res.redirect("/")
    } catch (error) {
        console.error("login error", error);
        res.render("login", { message: "login failed. please try again later" })
    }
}

const logout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if (err) {
                console.log("session destruction error")
                return res.redirect("/pageNotFound");
            } else {
                return res.redirect("/")
            }
        })

    } catch (error) {
        console.log("Logout error", error);
        res.redirect("/pageNotFound")
    }
}

const loadShoppingPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user });
        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map((category) => category._id.toString());

        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        const products = await Product.find({
            isListed: true,
            category: { $in: categoryIds },
            quantity: { $gt: 0 },
        }).sort({ createdAt: -1 }).limit(9);
        
        const totalProducts = await Product.countDocuments({
            isListed: true,
            category: { $in: categoryIds },
            quantity: { $gt: 0 }
        })
        
        const totalPages = Math.ceil(totalProducts / limit)

        const brands = await Brand.find({ isBlocked: false });
        const categoriesWithIds = categories.map(category => ({ _id: category._id, name: category.name }));

        if (userData) {
            return res.render("shop", {
                user: userData,
                products: products,
                category: categoriesWithIds,
                brand: brands,
                totalProducts: totalProducts,
                currentPage: page,
                totalPages: totalPages
            });
        } else {
            return res.render("shop", {
                products: products,
                category: categoriesWithIds,
                brand: brands,
                totalProducts: totalProducts,
                currentPage: page,
                totalPages: totalPages
            });
        }


    } catch (error) {
        res.redirect('/pageNotFound')

    }
}


const filterProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const categoryId = req.query.category;
        const brandId = req.query.brand;    

        const query = {
            isListed: false,
            quantity: { $gt: 0 },
        };

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });

        if (categoryId) {
            // const findCategory = await Category.findOne({ _id: categoryId, isListed: true });
            const products = await Product.find({isListed:true,category:categoryId})
                return res.render("shop", {
                    user: null,
                    products: products,
                    category,
                    brand,
                    selectedCategory: categoryId,
                    selectedBrand: null,
                    totalPages: 0,
                    currentPage: 1,
                });
            
        }

        if (brandId) {
            const findBrand = await Brand.findOne({ _id: brandId, isBlocked: false });
            // if (brand) {
            //     query.brand = brand.brandName; 
            // }

            const products = await Product.find({isListed:true,brand:findBrand.brandName})
            return res.render("shop", {
                user: null,
                products: products,
                category,
                brand,
                selectedCategory: categoryId,
                selectedBrand: null,
                totalPages: 0,
                currentPage: 1,
            });
        
        }

        const products = await Product.find(query).lean().sort({ createdAt: -1 });

        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const totalPages = Math.ceil(products.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);


        let userData = null;
        if (user) {
            userData = await User.findOne({ _id: user });
            if (userData) {
                const searchEntry = {
                    category: categoryId || null,
                    brand: brandId || null,
                    searchedOn: new Date(),
                };
                userData.searchHistory.push(searchEntry);
                await userData.save();
            }
        }

        res.render("shop", {
            user: userData,
            products: currentProducts,
            category,
            brand,
            selectedCategory: categoryId,
            selectedBrand: brandId,
            totalPages,
            currentPage,
        });
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
};


// const filterProduct = async(req,res)=>{
//     try {
//         const user = req.session.user;
//         const category = req.query.category;
//         const brand = req.query.brand;
//         const findCategory = category ? await Category.findOne({_id:category}):null;
//         const findBrand = brand ? await Brand.findOne({_id:brand}): null;
//         const brands = await Brand.find({}).lean();
//         const query ={
//             isBlocked : false,
//             quantity : {$gt:0}
//         }

//         if(findCategory){
//             query.category = findCategory._id;
//         }

//         if(findBrand){
//             query.brand = findBrand.brandName;
//         }
        
//         let  findProducts = await Product.find(query).lean().sort({createdAt: -1});

//         const categories = await Category.find({isListed:true});
        
//         let itemsPerPage = 6;
        
//         let currentPage = parseInt(req.query.page) || 1;
//         let startIndex = (currentPage-1)*itemsPerPage;
//         let endIndex = startIndex+itemsPerPage;
//         let totalPages = Math.ceil(findProducts.length/itemsPerPage);
//         const currentProduct = findProducts.slice(startIndex,endIndex);
//         let userData = null;
//         if(user){
//             userData = await User.findOne({_id:user});
//             if(userData){
//                 const searchEntry = {
//                     category : findCategory ? findCategory._id:null,
//                     brand: findBrand ? findBrand.brandName :null,
//                     searchedOn :new Date()
//                 }
//                 userData.searchHistory.push(searchEntry);
//                 await userData.save();
//             }
//          }
       
//         req.session.filteredProducts = currentProduct;
        
//         console.log(findCategory,'findCategory')
//         req.render("shop",{
//             user : userData,
//             products:currentProduct.at,
//             category : category,
//             brand :brand,
//             totalPages,
//             currentPage,
//             selectedCategory:category ||  null,
//             selectedBrand :brand || null,                   

//         })



//     } catch (error) {
//         res.redirect('/pageNotFound')
//     }
// }

const filterByPrice = async (req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        const brands = await Brand.find({}).lean();
        const categories = await Category.find({isListed:true}).lean();

        let findProducts = await Product.find({
            salePrice : {$gt:req.query.gt,$lt:req.query.lt},
            isBlocked:false,
            quantity : {$gt:0}
        }).lean();

        findProducts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        
        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage-1)*itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(findProducts.length/itemsPerPage);
        let currentProduct = findProducts.slice(startIndex,endIndex);
        req.session.filteredProducts = findProducts ;
        res.render("shop",{
            user : userData,
            products : currentProduct,
            category: categories,
            brand : brands,
            totalPages,
            currentPage,

        })
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound")
    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    securepassword,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadVerifyOtp,
    loadShoppingPage,
    filterProduct,
    filterByPrice
}
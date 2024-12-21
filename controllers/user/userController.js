const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Banner = require("../../models/bannerSchema");
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require("../../models/orderSchema");
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
                isListed: true,
                category: { $in: categories.map(category => category._id) }, quantity: { $gt: 0 }
            }
        ).sort({ createdAt: -1 }).limit(9)

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

     
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword
        });

        await newUser.save();

   
        delete req.session.userData;

        return res.redirect("/login");
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
            return res.redirect("/signup"); 
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
        console.log(page)
        const limit = 9;
        const skip = (page - 1) * limit;

        const products = await Product.find({
            isListed: true,
            category: { $in: categoryIds },
            quantity: { $gt: 0 },
        }).sort({ createdAt: -1 }).limit(9).skip(skip);
        
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

// const filterByPrice = async (req,res)=>{
//     try {
//         const user = req.session.user;
//         const userData = await User.findOne({_id:user});
//         const brands = await Brand.find({}).lean();
//         const categories = await Category.find({isListed:true}).lean();

//         let findProducts = await Product.find({
//             salePrice : {$gt:req.query.gt,$lt:req.query.lt},
//             isBlocked:false,
//             quantity : {$gt:0}
//         }).lean();

//         findProducts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        
//         let itemsPerPage = 6;
//         let currentPage = parseInt(req.query.page) || 1;
//         let startIndex = (currentPage-1)*itemsPerPage;
//         let endIndex = startIndex + itemsPerPage;
//         let totalPages = Math.ceil(findProducts.length/itemsPerPage);
//         let currentProduct = findProducts.slice(startIndex,endIndex);
//         req.session.filteredProducts = findProducts ;
//         res.render("shop",{
//             user : userData,
//             products : currentProduct,
//             category: categories,
//             brand : brands,
//             totalPages,
//             currentPage,

//         })
//     } catch (error) {
//         console.log(error);
//         res.redirect("/pageNotFound")
//     }
// }

const filterByPrice = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user });
        const brands = await Brand.find({}).lean();
        const categories = await Category.find({ isListed: true }).lean();

        const gt = parseInt(req.query.gt) || 0;  
        const lt = parseInt(req.query.lt) || 1000000; 

        console.log(gt,'gt')
        let findProducts = await Product.find({
            salePrice: { $gt: gt, $lt: lt },
            isListed: true,
            quantity: { $gt: 0 }
        }).lean();

        findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);

        const currentProduct = findProducts.slice(startIndex, endIndex);

        req.session.filteredProducts = findProducts;

        res.render("shop", {
            user: userData,
            products: currentProduct,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
        });
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound");
    }
};

const filterByPriceRange = async (req, res) => {
    try {

        const user = req.session.user;
        const userData = await User.findOne({ _id: user });
        const brands = await Brand.find({}).lean();
        const categories = await Category.find({ isListed: true }).lean();

        const gt = parseInt(req.query.gt) || 0;  
        const lt = parseInt(req.query.lt) || 1000000; 
        const sort = req.query.sort || null; 

        let findProducts = await Product.find({
            salePrice: { $gt: gt, $lt: lt },
            isListed: true,
            quantity: { $gt: 0 },
        }).lean();

        if (sort === "asc") {
            findProducts.sort((a, b) => a.salePrice - b.salePrice); 
        } else if (sort === "desc") {
            findProducts.sort((a, b) => b.salePrice - a.salePrice); 
        } else {
            findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        }

        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);

        const currentProduct = findProducts.slice(startIndex, endIndex);

        req.session.filteredProducts = findProducts;

        res.render("shop", {
            user: userData,
            products: currentProduct,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
        });
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound");
    }
};


const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        let cart = await Cart.findOne({ userId }).populate('items.productId'); 

        
        if (!cart) {
            return res.render('cart', { message: 'Your cart is empty.' }); 
        }
  
        const totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

        res.render('cart', { cart: cart,totalPrice });
  
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



//   const postAddToCart = async (req, res) => {
//     try {
//         const { productId, quantity } = req.body; // Assuming you are sending productId and quantity in the request body
//         const userId = req.session.user;

//         // Find the product to get its price
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).send('Product not found');
//         }
//         const price = product.salePrice;

//         let cart = await Cart.findOne({ userId });

//         if (!cart) {
//             // If no cart exists for the user, create a new one
//             cart = new Cart({
//                 userId,
//                 items: [{ productId, quantity, price: price * quantity }],
//                 totalPrice: price * quantity
//             });
//         } else {
//             // Check if the product already exists in the cart
//             const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

//             if (existingItemIndex !== -1) {
//                 // Product exists in the cart, update quantity and price
//                 cart.items[existingItemIndex].quantity += quantity;
//                 cart.items[existingItemIndex].price += price * quantity;
//             } else {
//                 // Product does not exist in the cart, add new item
//                 cart.items.push({ productId, quantity, price: price * quantity });
//             }

//             // Update the total price of the cart
//             cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
//         }

//         await cart.save();
//         res.status(200).send({ message: 'Item added to cart' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };
// const postAddToCart = async (req, res) => {
//     try {
//         const { productId, quantity } = req.body;
//         const userId = req.session.user;

//         // Find the product by its ID
//         const product = await Product.findById(productId);
//         console.log("Product:", product); // Check if product data is being fetched

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         // Check if the requested quantity is available in stock
//         if (quantity > product.quantity) {
//             return res.status(400).send('Not enough stock available');
//         }

//         // Check if the user has already added this product to the cart
//         let cart = await Cart.findOne({ userId });
//         if (!cart) {
//             cart = new Cart({
//                 userId,
//                 items: [{ productId, quantity, price: product.salePrice * quantity }]
//             });
//         } else {
//             const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

//             // If the product already exists in the cart, check the max quantity limit per user
//             if (existingItemIndex !== -1) {
//                 const currentQuantityInCart = cart.items[existingItemIndex].quantity;
//                 const newQuantity = currentQuantityInCart + quantity;

//                 // Check if the new quantity exceeds the maxQtyPerPerson
//                 if (newQuantity > product.maxQtyPerPerson) {
//                     return res.status(400).send(`You can add a maximum of ${product.maxQtyPerPerson} of this product`);
//                 }

//                 // Update the quantity and price
//                 cart.items[existingItemIndex].quantity += quantity;
//                 cart.items[existingItemIndex].price += product.salePrice * quantity;
//             } else {
//                 // New item to add
//                 cart.items.push({ productId, quantity, price: product.salePrice * quantity });
//             }
//         }

//         // Save the cart with the updated product
//         await cart.save();
//         res.status(200).send({ message: 'Item added to cart' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };

const postAddToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        const product = await Product.findById(productId);
   

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const maxQtyPerPerson = product.maxQtyPerPerson;
      

        let cart = await Cart.findOne({ userId });
       

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ productId, quantity, price: product.salePrice * quantity }]
            });
        } else {
            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            const currentQty = existingItemIndex !== -1 ? cart.items[existingItemIndex].quantity : 0;

            if (currentQty > product.maxQtyPerPerson) {
                return res.status(400).send({ message: `You can only add up to ${product.maxQtyPerPerson} units of this product.` });
            }

            if (existingItemIndex !== -1) {
                cart.items[existingItemIndex].quantity += quantity;
                cart.items[existingItemIndex].price += product.salePrice * quantity;
            } else {
                cart.items.push({ productId, quantity, price: product.salePrice * quantity });
            }
        }

        await cart.save();
        res.status(200).send({ message: 'Item added to cart' });
    } catch (error) {
        console.error("Error in postAddToCart:", error);
        res.status(500).send('Server Error');
    }
};

const incrementQuantity = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.session.user;
        

    

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const item = cart.items.find((item) => item._id.toString() === itemId);
        const product = await Product.findById(item.productId);
        

        const currentQty = item.quantity
        if (currentQty >= product.maxQtyPerPerson) {
            return res.status(400).send({ message: `You can only add up to ${product.maxQtyPerPerson} units of this product.` });
        }

        if (item) {
            item.quantity += 1;
            item.price = item.quantity * item.productId.salePrice; 
            
            await cart.save();
            return res.json({ success: true, message: 'Quantity increased successfully.' });
        }
        res.status(404).json({ success: false, message: 'Item not found.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const decrementQuantity = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const item = cart.items.find((item) => item._id.toString() === itemId);

        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                item.price = item.quantity * item.productId.salePrice; 
                await cart.save();
                return res.json({ success: true, message: 'Quantity decreased successfully.' });
            } else {
                return res.json({ success: false, message: 'Minimum quantity is 1.' });
            }
        }
        res.status(404).json({ success: false, message: 'Item not found.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const removeItem = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });
        if (cart) {
            const initialLength = cart.items.length;
            cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

            if (cart.items.length < initialLength) {
                await cart.save();
                return res.json({ success: true, message: 'Item removed successfully.' });
            }
        }
        res.status(404).json({ success: false, message: 'Item not found.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user;
    
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart'); 
        }

        const addresses = await Address.find({ userId });

        let subtotal = 0;
        cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        let cartId = cart?._id
        console.log(cartId,'cartid')
        return res.render('checkout', {
            cartItems: cart.items,
            total:subtotal,
            addresses,
            cartId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const getOrderConfirmationPage = async (req, res) => {
    try {
    

        const orderId = req.query.orderId; 
        console.log(orderId,'prderd')
        const order = await Order.findOne({ _id:orderId }).sort({ createdAt: -1 });
        console.log('Order retrieved:', order);

        if (!order) {
            return res.redirect('/cart'); 
        }

        console.log('Order confirmation page accessed');
        
        return res.render('orderconfirmation', {
            orderId: order._id,
            deliveryTime: '7 days', 
            orderItems: order.items,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const createOrder = async (req, res) => {
    try {
        const { cartId, addressId, paymentMethod } = req.body;
        const cart = await Cart.findById({_id:cartId}).populate("items.productId");
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const address = await Address.findOne({
            "address._id": addressId
        });

        if (!address) {
            return res.status(404).send('Address not found');
        }

        let totalPrice = 0;
        for (let item of cart.items) {
            const product = item.productId;
            
            const quantity = item.quantity;
            
            if (product.quantity < quantity) {
                console.log('not ')
                return res.status(400).send(`Not enough stock for product ${product.name}`);
            }
            product.quantity -= quantity; 
            await product.save(); 

            if (product.salePrice && !isNaN(product.salePrice)) {
                totalPrice += product.salePrice * quantity;
            } else {
                console.error('Invalid sale price for product:', product.productName);
                return res.status(400).send(`Invalid price for product ${product.productName}`);
            }

        }

        const finalAmount = totalPrice;

        if (isNaN(finalAmount) || finalAmount <= 0) {
            console.error('Invalid total price calculation:', finalAmount);
            return res.status(400).send('Invalid total price calculation');
        }
        
        const newOrder = new Order({
            orderedItems: cart.items.map(item => ({
                products: item.productId,
                quantity: item.quantity,
                price: item.productId.saleprice,
            })),
            finalAmount,
            address: addressId,
            invoiceDate: new Date(),
            status: "pending", 
            coupenApplied: cart.coupenApplied,
            paymentMethod
        });
        
        await newOrder.save();
        cart.items = [];
        await cart.save();
        res.status(201).json({
            message: "Order placed successfully",
            orderId: newOrder._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


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
    filterByPrice,
    filterByPriceRange,
    addToCart,
    postAddToCart,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    getCheckoutPage,
    getOrderConfirmationPage,
    createOrder
}
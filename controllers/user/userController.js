
const User = require("../../models/userSchema")

const pageNotFound = async(req,res)=>{
    try {
        res.render("page-404 ")
    }catch (error){
        res.redirect("/pageNotFound")
    }
}






const loadHomepage = async (req,res)=>{
    try {
       return res.render("home");
    }catch (error){
       console.log("home pag enot found");
       res.status(500).send("server error")
    }
}

const loadSignup = async(req,res)=>{
    try{
        return res.render("signup");
    }catch(error){
        console.log("Home page not loading",error);
        res.status(500).send("Server error");
    }
}
// const signup = async(req,res)=>{
//     const {name,email,phone,password} = req.body;
//     try{
//        const  newUser = new User({name,email,phone,password});
//        await newUser.save();
//        return res.redirect("/signup")
//     }catch(error){
//        console.log("Error for save user", error);
//        res.status(500).send("Internal server error");
//     }
// }

const signup = async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("Email is already registered.");
        }

        // If not, create a new user
        const newUser = new User({ name, email, phone, password });
        await newUser.save();

        return res.redirect("/signup");
    } catch (error) {
        console.log("Error for save user", error);

        // Handle specific MongoDB duplicate key errors
        if (error.code === 11000) {
            const key = Object.keys(error.keyPattern)[0]; // e.g., 'email' or 'googleId'
            return res.status(400).send(`${key} is already in use.`);
        }

        // Handle other errors
        res.status(500).send("Internal server error.");
    }
};





const loadShopping = async(req,res)=>{
    try{
        return res.render("shop");

    }catch(error){
        console.log("Shopping page not found ", error);
        res.status(500).sed("Server Error");
        
    }
}






module.exports ={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    loadShopping 
}
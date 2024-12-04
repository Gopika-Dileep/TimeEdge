const express = require ("express");

const app = express();
const path = require ("path");
const dotenv=require("dotenv");
const session = require("express-session");
const passport = require('./config/passport');
const User = require('./models/userSchema')
dotenv.config();

const db = require("./config/db");
const userRouter = require("./routes/userRouter");


db()


app.use(express.json());
app.use (express.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SESSION_SECRET,
    ressave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

app.use(async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user).select('name email'); // Fetch user details
            res.locals.user = user; // Make user details available in templates
        } else {
            res.locals.user = null;
        }
        next();
    } catch (error) {
        console.error("Error in user middleware:", error);
        res.locals.user = null;
        next();
    }
});

app.use(passport.initialize());
app.use(passport.session())

app.use((req,res,next)=>{
    res.set("cache-control","no-store")
    next();
})

app.set("view engine","ejs");
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, "public")));

app.use("/",userRouter);

const PORT = 3000|| process.env.PORT;
app.listen(PORT,()=>{
    console.log("server is running");
    
})

module.exports = app;
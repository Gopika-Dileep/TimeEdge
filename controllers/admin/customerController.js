const { default: mongoose } = require("mongoose");
const User = require("../../models/userSchema");


// const customerInfo = async (req,res)=>{
//        try {
//            let search = "";
//            if(req.query.search){
//                search = req.query.search;
//            }
//            let page = 1;
//            if(req.query.page){
//             page=req.query.page
//            }

//            const limit = 3
//            const userData = await User.find({
//             isAdmin:false,
//             $or:[
//                 {name:{$regex:".*"+search+".*"}},
//                 {email:{$regex:".*"+search+".*"}}
//             ]
//            })
//            .limit(limit*1)
//            .skip((page-1)*limit)
//            .exec();

//            const count = await User.find({
//             $or:[
//                 {name:{$regex:".*"+search+".*"}},
//                 {email:{$regex:".*"+search+".*"}}
//             ]
//            }).countDocuments();
//            res.render("usersList")

//        } catch (error) {
        
//        }
// }


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || ""; 
        let page = parseInt(req.query.page) || 1;
        const limit = 3;

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } }, 
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({createdOn:-1})
            .exec();

        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        });

        const totalPages = Math.ceil(count / limit);

        res.render("usersList", {
            customers: userData,
            search: search,
            pagination: {
                totalPages: totalPages,
                currentPage: page,
            },
        });
    } catch (error) {
        console.error("Error fetching customer info:", error);
        res.status(500).send("An error occurred while fetching customer data.");
    }
};


const blockUser = async (req,res)=>{
   try {
     const userId = req.params.userId;
     if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error("Invalid User ID")
     }
     const userUpdate = await User.findByIdAndUpdate({_id:userId},{isBlocked:true})
     return res.redirect('/admin/users')

   } catch (error) {
         console.error("Error fetching customer info:", error);
        res.status(500).send("An error occurred while blocking customer data.");
   }
}
const unblockUser = async (req,res)=>{
    try {
      const userId = req.params.userId;
      if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error("Invalid User ID")
     }
      const userUpdate = await User.findByIdAndUpdate({_id:userId},{isBlocked:false})
      return res.redirect('/admin/users')
 
    } catch (error) {
          console.error("Error fetching customer info:", error);
         res.status(500).send("An error occurred while unblocking customer data.");
    }
 }
 

module.exports = {
    customerInfo,
    blockUser,
    unblockUser
}
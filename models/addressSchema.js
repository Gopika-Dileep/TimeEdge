const mongoose = require("mongoose");
const{Schema} = mongoose;

const addressSchema= new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address:[{
         addressType:{
            type:string,
            required:true
         },
         name:{
            type:string,
            required:true,
         },
         city:{
            type:String,
            required :true
         },
         landMark:{
            type:String,
            required:true
         },
         state:{
            type:String,
            required:true
         },
         pincode:{
            type:Number,
            required:true
         },
         phone:{
            typq:String,
            required:true
         },
         altPhone:{
            type:String,
            required:true,
         }

    }]

})



const Address = mongoose.model("Address,addressSchema");

module.exports = address;
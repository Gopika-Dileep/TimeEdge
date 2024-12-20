const mongoose = require ("mongoose");
const { Types } = require("mongoose");
const {Schema} = mongoose;

const orderSchema = new Schema({
    orderedItems:[{
        products:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
        }],
        // totalPrice:{
        //     type:Number,
        //     required:true
        // },

        // discount:{
        //     type:Number,
        //     default:0
        // },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:["pending","Processing","Shipped","delivered","Cancelled","Return request","Returned"]
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    coupenApplied:{
        type:Boolean,
        default:false
    },
    paymentMethod:{
        type:String,
    }
})

const Order = mongoose.model("order",orderSchema);
module.exports = Order;
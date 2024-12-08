const mongoose = require ("mongooe");
const { Types } = require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4}= require('uuid');

const orderSchema = new Schema({
    orderId:{
        type:string,
        default:()=>uuidv4(),
        unique:true
    },
    orderedItems:[{
        products:{
            type:Schema>Types.ObjectId,
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
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
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
    }
})

const Order = mongoose.model("order",orderSchema);
module.exports = Order;
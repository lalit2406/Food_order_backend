import mongoose, {Schema, Document} from 'mongoose';


export interface OfferDoc extends Document {

offerType: string; //vandor // genric
vandors: [any]; //[855848499]
title: string;// INR 500 OFF
description: string; // any description with terms and conditions
minvalue: number; //minimum cart value to apply offer
offerAmount: number; //200
startValidity: Date; //
endValidity: Date;
promocode: string; //week200
promoType: string; //user //all //bank //card
banks: [any];
bins: [any];
pincode: string;
isActive: boolean;
 
}


const OfferSchema = new Schema({

offerType: {type: String, required: true}, 
vandors: [
    {type: [Schema.Types.ObjectId], ref: 'Vandor'}
],
title: {type: String, required: true},
description:  String, 
minvalue: {type: Number, required: true}, 
offerAmount: {type: Number, required: true},
startValidity:  Date,
endValidity: Date, 
promocode: {type: String, required: true}, 
promoType: {type: String, required: true}, 
banks: [
    {type: String}
],
bins: [
    {type: Number}
],
pincode: {type: String, required: true},
isActive:  Boolean,

},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;

        }
    },
    timestamps: true
});


const Offer = mongoose.model<OfferDoc>('offer', OfferSchema);

export { Offer }
import { CreateOfferInputs, EditVandorInputs, VandorLoginInputs } from "../dto";
import { CreateFoodInputs } from "../dto";
import { Food, Offer, Order } from "../models"
import { GenerateSignature, ValidatePassword, UploadImage } from "../utility";
import { FindVandor } from "./AdminController";
import { Request, Response, NextFunction } from 'express';

export const VandorLogin = async (req: Request, res: Response, next: NextFunction) => {

    const { email, password } = <VandorLoginInputs>req.body;

    const existingVandor = await FindVandor('', email);
    if(existingVandor !== null){
        // verify password

        const validation = await ValidatePassword(password, existingVandor.password, existingVandor.salt);

        if(validation){
            const signature = await GenerateSignature({
                _id: existingVandor._id,
                email: existingVandor.email,
                name: existingVandor.name,
                foodTypes: existingVandor.foodTypes,
            
            });

            return res.json({ token: signature });
        }
        else{
            return res.json({ "message": "Password is not valid" });
        }

    }

    return res.json({ "message": "Login credential are invalid"});

}


export const GetVandorProfile = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {

        const existingVandor = await FindVandor(user._id);

        return res.json(existingVandor);
    }


    return res.json({ message: "Vandor info not found" });
}





export const UpdateVandorProfile = async (req: Request, res: Response, next: NextFunction) => {

    const { foodTypes, name, address, phone } = <EditVandorInputs> req.body;
    const user = req.user;

    if (user) {

        const existingVandor = await FindVandor(user._id);
        if(existingVandor){
            existingVandor.name = name;
            existingVandor.address = address;
            existingVandor.phone = phone;
            existingVandor.foodTypes = foodTypes;

            const savedResult = await existingVandor.save();
            return res.json(savedResult);
        }

        return res.json(existingVandor);
    }


    return res.json({ message: "Vandor info not found" });

}


export const UpdateVandorCoverImage = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {
        const vandor = await FindVandor(user._id);

        if (vandor !== null) {

            const files = req.files as Express.Multer.File[] | undefined;

            const images = [];

            // NEW LOGIC: Upload to Cloudinary
            if (files && files.length > 0) {
                for (const file of files) {
                    const resultUrl = await UploadImage(file);
                    if(resultUrl){
                        images.push(resultUrl); // Push the FULL Cloudinary URL
                    }
                }
            }

            // Save the Cloudinary URLs to the database
            vandor.coverImages.push(...images);
            
            const result = await vandor.save();
            
            return res.json(result);
        }
    }

    return res.json({ message: "Vandor info not found" });
}

export const UpdateVandorService = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    const{lat, lng} = req.body;

    if (user) {

        const existingVandor = await FindVandor(user._id);
        if(existingVandor){
            existingVandor.serviceAvailable = !existingVandor.serviceAvailable;

            if(lat && lng){
                existingVandor.lat = lat;
                existingVandor.lng = lng;
            }

            const savedResult = await existingVandor.save();
            return res.json(savedResult);
        }


        return res.json(existingVandor);
    }


    return res.json({ message: "Vandor info not found" });
}



export const AddFood = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {

        const { name, description, category, foodType, readyTime, price } = <CreateFoodInputs>req.body;

        const vandor = await FindVandor(user._id);
if (vandor !== null) {

    const files = req.files as Express.Multer.File[] | undefined;

    // STOP THE PROCESS IF NO FILES
    if(!files || files.length === 0) {
        return res.status(400).json({ message: "Error: No images found in request." });
    }

    const images = [];
            
            // Loop through all uploaded files
            for (const file of files) {
                // Upload to Cloudinary
                const resultUrl = await UploadImage(file);
                
                if(resultUrl) {
                    images.push(resultUrl); // Push the Cloud URL, not the filename
                }
            }

            const createdFood = await Food.create({
                vandorId: vandor._id,
                name: name,
                description: description,
                category: category,
                foodType: foodType,
                images: images,
                readyTime: readyTime,
                price: price,
                rating: 0
            });

            vandor.foods.push(createdFood);
            const result = await vandor.save();
            return res.json({ result });
        }

    }

    return res.json({ message: "Something went wrong with add food" });
}



export const GetFoods = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {

        const foods = await Food.find({ vandorId: user._id });
        return res.json(foods);

    }


    return res.json({ message: "foods info not found" });
}


export const GetCurrentOrders = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if(user){
        const orders = await Order.find({vandorId: user._id }).populate('items.food');

        if(orders != null){
            return res.status(200).json(orders);
        }

    }

    return res.json({message: 'order not found'});


}


export const GetOrderDetails = async (req: Request, res: Response, next: NextFunction) => {

    const orderId = req.params.id;

    if(orderId){
        const order = await Order.findById(orderId).populate('items.food');
            if(order != null){
            return res.status(200).json(order);
        }

    }

    return res.json({message: 'order not found'});


}

export const ProcessOrder = async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;

    // PREVENTATIVE FIX: Check for req.body existence before destructuring
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing or empty." });
    }

    const { status, remarks, time } = req.body; //accept //reject //ready //under process

    if(orderId){
        // Assuming Order.findById returns a Mongoose document which is mutable
        const order = await Order.findById(orderId).populate('food');

        // Added null check for order
        if (!order) {
            return res.json({message: 'Order not found for processing'});
        }

        order.orderStatus = status;
        order.remarks = remarks;
        if(time){
            order.readyTime = time;
        }

        const orderResult = await order.save();
            if(orderResult != null){
            return res.status(200).json(orderResult);
        }
    }
    return res.json({message: 'unable to process order'});
}


export const GetOffers = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {

        
            let currentOffers = Array();

        const offers = await Offer.find().populate('vandors');

        if(offers){

            offers.map(item =>{
                if(item.vandors){
                    item.vandors.map(vandor =>{
                        if(vandor._id.toString() === user._id.toString()){
                            currentOffers.push(item);
                        }
                    })
                }

                if(item.offerType === "GENERIC"){
                    currentOffers.push(item);
                }
            })
        }
return res.json( currentOffers );
    }
return res.json({ message: "No offers found" });
}

export const AddOffer = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // CRASH FIX: Ensure req.body is defined before attempting to destructure
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing or empty. " });
    }

    if (user) {
        const {title, description,offerType, minvalue, offerAmount, startValidity, endValidity, promocode, promoType, banks, bins, pincode, isActive} = <CreateOfferInputs>req.body;

        const vandor = await FindVandor(user._id);

        if (vandor) {

            const offer = await Offer.create({
                offerType,
                title,
                description,
                offerAmount,
                minvalue,
                startValidity,
                endValidity,
                promocode,
                promoType,
                banks,
                bins,
                pincode,
                isActive,
                vandors: [vandor]
            });

            console.log(offer);

            return res.status(200).json( offer );
        }
    }
    return res.json({ message: "Something went wrong with add offer" });
}
export const EditOffer = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    const offerId = req.params.id;

    if(user){

        const{title, description,offerType, minvalue, offerAmount, startValidity, endValidity, promocode, promoType, banks, bins, pincode, isActive} = <CreateOfferInputs>req.body;

        const currentOffer = await Offer.findById(offerId);


        if(currentOffer){

            const vandor = await FindVandor(user._id);

            if(vandor){
            currentOffer.title= title;
            currentOffer.description= description;
            currentOffer.offerType= offerType;
            currentOffer.offerAmount= offerAmount;
            currentOffer.minvalue= minvalue;
            currentOffer.startValidity= startValidity;
            currentOffer.endValidity= endValidity;
            currentOffer.promocode= promocode;
            currentOffer.promoType= promoType;
            currentOffer.banks= banks;
            currentOffer.bins= bins;
            currentOffer.pincode= pincode;
            currentOffer.isActive= isActive;

            const result = await currentOffer.save();
            
            return res.json(result);

        }
    }

}
    return res.json({ message: "Something went wrong with edit offer" });

}
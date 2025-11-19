import express, {Response, Request, NextFunction} from 'express';
import {plainToClass} from 'class-transformer';
import { validate } from 'class-validator';
import { CartItem, CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs, OrderInputs } from '../dto';
import { GenerateOTP, GeneratePassword, GenerateSalt, GenerateSignature, onRequestOTP, SendVerificationEmail, ValidatePassword } from '../utility';
import { Customer } from '../models/Customer';
import { DeliveryUser, Food, Offer, Transaction, Vandor } from '../models';
import { Order } from '../models/Order';

export const CustomerSignup = async (req: Request, res: Response, next: NextFunction) => {

    const customerInputs = plainToClass(CreateCustomerInputs, req.body);

    const inputErrors = await validate(customerInputs, {validationError: {target: true}});
    if(inputErrors.length > 0){
        return res.status(400).json(inputErrors);
    }

    const { email, phone, password } = customerInputs;

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    const { otp, expiry } = GenerateOTP();

    const existCustomer = await Customer.findOne({ email: email });

    if(existCustomer){
        return res.status(409).json({message: 'Customer with this email already exists'});
    }


    const result = await Customer.create({
        email: email,
        password: userPassword,
        salt: salt,
        phone: phone,
        otp: otp,
        otp_expiry: expiry,
        firstName: '',
        lastName: '',
        address: '',
        verified: false,
        lat: 0,
        lng: 0,
        orders: []
    })

    if(result){

        // send OTP to user phone number - uncomment if using SMS OTP
        // await onRequestOTP(otp, phone);

        // Send OTP via email
        await SendVerificationEmail(email, otp); 

        // generate the signature
        const signature = await GenerateSignature({

            _id: (result as any)._id.toString(),
            email: result.email,
            verified: result.verified

        })

        // send the request to the client side
        return res.status(201).json({
            signature: signature,
            verified: result.verified,
            email: result.email
        });

    }

    return res.status(400).json({message: 'Error creating customer account'});
}


export const CustomerLogin = async (req: Request, res: Response, next: NextFunction) => {

    const loginInputs = plainToClass(UserLoginInputs, req.body);

    const loginErrors = await validate(loginInputs, {validationError: {target: false}});

    if(loginErrors.length > 0) {
        return res.status(400).json(loginErrors)

    }

    const {email, password} = loginInputs;

    const customer = await Customer.findOne({email: email})

    if(customer){

        const validation = await ValidatePassword(password, customer.password,customer.salt);

        if(validation){

            const signature = await GenerateSignature({
             
            _id: (customer as any)._id.toString(),
            email: customer.email,
            verified: customer.verified

        })
        // send the request to the client side
        return res.status(201).json({
            signature: signature,
            verified: customer.verified,
            email: customer.email
        })
    }
    }
        return res.status(404).json({message: 'Login Error'});

}
export const CustomerVerify = async (req: Request, res: Response, next: NextFunction) => {

    const { otp } = req.body;
    const customer = req.user;

    if(customer) {

        const profile = await Customer.findById(customer._id);
        if(profile) {
            // Check if OTP matches and is not expired
            if(profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
                profile.verified = true;

                const updatedCustomerResponse = await profile.save();

                // generate the signature
                const signature = await GenerateSignature({
                    _id: (updatedCustomerResponse as any)._id.toString(),
                    email: updatedCustomerResponse.email,
                    verified: updatedCustomerResponse.verified
                });

                return res.status(201).json({
                    signature: signature,
                    verified: updatedCustomerResponse.verified,
                    email: updatedCustomerResponse.email
                });
            }
        }
    }

    return res.status(400).json({message: 'Error with OTP validation or expired OTP'});
}

export const RequestOTP = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    if(customer) {

        const profile = await Customer.findById(customer._id);
        if(profile) {

            const { otp, expiry } = GenerateOTP();

            profile.otp = otp;
            profile.otp_expiry = expiry;

            await profile.save();

            // Send OTP via phone (uncomment if configured)
            // await onRequestOTP(otp, profile.phone); 
            // Send OTP via email (add if needed)
            // await SendVerificationEmail(profile.email, otp);

            return res.status(200).json({message: 'OTP sent successfully'});

        }
    }

    return res.status(400).json({message: 'Error with OTP request'});
}


export const GetCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    if(customer) {
        const profile = await Customer.findById(customer._id);
        if(profile) {
            return res.status(200).json(profile);
        }
    }

    return res.status(404).json({message: 'Profile not found'});
}


export const EditCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
    
    const profileErrors = await validate(profileInputs, {validationError: {target: false}});

    if(profileErrors.length > 0) {
        return res.status(400).json(profileErrors);
    }

    const {firstName, lastName, address} = profileInputs;

    if(customer) {

        const profile = await Customer.findById(customer._id)


        if(profile) {
            profile.firstName = firstName;
            profile.lastName = lastName;
            profile.address = address;  

            const result = await profile.save();

            return res.status(200).json(result);
        }
    }

    return res.status(400).json({message: 'Error updating profile'});
}


// -------------cart section-------------//
export const AddToCart = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    if(customer){

        const { _id, unit } = <CartItem> req.body;
        
        // 1. Try to find the item in the cart and update its unit count atomically.
        // The "cart.food" query checks if this specific food ID already exists in the array.
        let result = await Customer.findOneAndUpdate(
            { _id: customer._id, "cart.food": _id },
            { $inc: { "cart.$.unit": unit } }, // $inc works for both +1 and -1 (to decrease)
            { new: true }
        ).populate('cart.food');

        // 2. If "result" is null, it means the food item was NOT in the cart yet.
        if(!result){
            // So we push a brand new item into the cart array.
            result = await Customer.findOneAndUpdate(
                { _id: customer._id },
                { $push: { cart: { food: _id, unit: unit } } },
                { new: true }
            ).populate('cart.food');
        }

        // 3. Return the updated cart
        if(result){
             return res.status(200).json(result.cart);
        }
    }

    return res.status(400).json({message: 'Unable to add to cart!'});
}


export const GetCart = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;
    if(customer) {

        const profile = await Customer.findById(customer._id).populate('cart.food');
        if(profile) {
            return res.status(200).json(profile.cart);
        }
    }
    return res.status(400).json({message: 'Cart not found or empty'});

}

export const DeleteCart = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;
    if(customer) {

        const profile = await Customer.findById(customer._id);
        if(profile != null) {
            profile.cart = [] as any;
            const cartResult = await profile.save();
            return res.status(200).json(cartResult);
        }
            
      }
    return res.status(400).json({message: 'Error deleting cart'});
}

// -------------------create payment------------//

export const CreatePayment = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;

    const {amount, paymentMode,offerId} = req.body;

    let payableAmount = Number(amount);

    if(offerId) {

        const appliedOffer = await Offer.findById(offerId);

        if(appliedOffer){
            if(appliedOffer.isActive){
                payableAmount = (payableAmount - appliedOffer.offerAmount);

            }
        }
    }

    // perform payment gateway charge api call

    // create record on transcation

    const transaction = await Transaction.create({
          customer: customer._id,
        vandorId: '',
        orderId: '',
        orderValue: payableAmount,
        offerUsed: offerId || 'NA',
        status: 'OPEN', //failed 
        paymentMode: paymentMode,
        paymentResponse: 'Payment is cash on Delivery'
    })

    return  res.status(200).json(transaction);

}

// --------------Delivery notifications--------//

const assignOrderForDelivery = async (orderId:string, vandorId: string)=>{


    // find the vandor
    const vandor = await Vandor.findById(vandorId);

    if(vandor){

        const areaCode = vandor.pincode;
        const vandorLat = vandor.lat;
        const vandorLng = vandor.lng;


    // find the available delivery person 

    const deliveryPerson = await DeliveryUser.find({pincode:areaCode, verified: true, isAvailable: true}) as any[];
    
    if(deliveryPerson && deliveryPerson.length > 0){


    // check the nearest delivery person and assign the order

    console.log(`Delivery Person ${deliveryPerson[0]}`);

    const currentOrder = await Order.findById(orderId);

    if(currentOrder){

    // update delivery id
    currentOrder.deliveryId = deliveryPerson[0]._id.toString();
    const response = await currentOrder.save();
    
    console.log(response);
    // notify to vandor for received new order using firebase push notification

    }

}
    }

}

// --------------------order section-------------//

const validateTransaction = async (txnId: string) =>{
    const currentTransaction = await Transaction.findById(txnId);
    if(currentTransaction){
        if(currentTransaction.status.toLowerCase() !== "failed") {
        return{status: true, currentTransaction}
        }
    }
    return{status: false, currentTransaction}
}

export const CreateOrder = async (req: Request, res: Response, next: NextFunction) => {




    // Get current logged-in customer
    const customer = req.user;

    const{txnId, amount , items }= <OrderInputs>req.body;

    if(customer) {

    // validate transaction
    const{ status, currentTransaction} = await validateTransaction(txnId);

    if(!status){
        return res.status(404).json({ message:'Error with create order'})
    }
        
        const profile = await Customer.findById(customer._id);

        if (!profile) {
            // Customer ID from the token is invalid/deleted
            return res.status(404).json({ message: 'Customer profile not found for order creation.' });
        }

        // 1. Generate Order ID
        const orderId = `${Math.floor(Math.random() * 89999 + 10000)}`;

        let cartItems = Array();
        let netAmount = 0.0;
        let vandorId; // Initialized to undefined

        const foods = await Food.find().where('_id').in(items.map(item => item._id)).exec();

        foods.map(food => {
         items.map(({ _id, unit}) => {
                if(food._id == _id){
                    vandorId = food.vandorId;
                    netAmount += (food.price * unit);
                    cartItems.push({ food, unit: unit})
                }
            })
        })

        if(cartItems){

            const currentOrder = await Order.create({
                orderId: orderId,
                vandorId: vandorId,
                items: cartItems,
                totalAmount: netAmount,
                paidAmount: amount,
                orderDate: new Date(),
                orderStatus: 'Waiting',
                remarks: '',
                deliveryId: '',
                readyTime: 45

            });

            // Update customer profile: clear cart and add order
            profile.cart = [] as any;
            profile.orders.push(currentOrder);


            currentTransaction.vandorId = vandorId;
            currentTransaction.orderId = orderId;
            currentTransaction.status = 'CONFIRMED';

            await currentTransaction.save();

            assignOrderForDelivery(currentOrder._id.toString(), vandorId);

            const profileSaveResponse = await profile.save();

            // Return the updated customer profile with the new order
            res.status(200).json(profileSaveResponse);
        }
        else{
            return res.status(400).json({message: 'Error creating order: No valid items found or processed.'});
        }
    } 
}


export const GetOrders = async (req: Request, res: Response, next: NextFunction) => {   

    const customer = req.user;

    if(customer){
        const profile = await Customer.findById(customer._id).populate('orders');
        if(profile){
            return res.status(200).json(profile.orders);
        }
    }
    return res.status(404).json({message: 'Orders not found'});
    
}

export const GetOrderById = async (req: Request, res: Response, next: NextFunction) => {
        
    const orderId = req.params.id;

    if(orderId){
        const order = await Order.findById(orderId).populate('items.food');
            
        if (order) {
            return res.status(200).json(order);
        }
        return res.status(404).json({message: 'Order not found'});
    }
    return res.status(400).json({message: 'Order ID is missing'});
}

export const VerifyOffer = async (req: Request, res: Response, next: NextFunction) => {

    const offerId = req.params.id;

    const customer = req.user;

    if(customer){

        const appliedOffer = await Offer.findById(offerId);

        if(appliedOffer){

            if(appliedOffer.promoType === "USER"){
// only can apply once per user
            }else{
                if(appliedOffer.isActive){
                return res.status(200).json({message: 'Offer is valid ', offer: appliedOffer});
            }
            }

            

        }

    }

    return res.status(400).json({message: 'Invalid offer'});
}


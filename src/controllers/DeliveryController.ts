import express, {Response, Request, NextFunction} from 'express';
import {plainToClass} from 'class-transformer';
import { validate } from 'class-validator';
import { CartItem, CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs, OrderInputs, CreateDeliveryUserInputs } from '../dto';
import { GenerateOTP, GeneratePassword, GenerateSalt, GenerateSignature, onRequestOTP, SendVerificationEmail, ValidatePassword } from '../utility';
import { Customer } from '../models/Customer';
import { DeliveryUser, Food, Offer, Transaction, Vandor } from '../models';
import { Order } from '../models/Order';

export const DeliveryUserSignup = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUserInputs = plainToClass(CreateDeliveryUserInputs, req.body);

    const inputErrors = await validate(deliveryUserInputs, {validationError: {target: true}});
    if(inputErrors.length > 0){
        return res.status(400).json(inputErrors);
    }

    const { email, phone, password ,address, firstName, lastName, pincode } = deliveryUserInputs;

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);


    const existingDeliveryUser = await DeliveryUser.findOne({ email: email });

    if(existingDeliveryUser){
        return res.status(409).json({message: 'Delivery User with this email already exists'});
    }


    const result = await DeliveryUser.create({
        email: email,
        password: userPassword,
        salt: salt,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        address: address,
        pincode: pincode,
        verified: false,
        lat: 0,
        lng: 0,
        isAvailable: false
    })

    if(result){

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

    return res.status(400).json({message: 'Error with signup'});
}


export const DeliveryUserLogin = async (req: Request, res: Response, next: NextFunction) => {

    const loginInputs = plainToClass(UserLoginInputs, req.body);

    const loginErrors = await validate(loginInputs, {validationError: {target: false}});

    if(loginErrors.length > 0) {
        return res.status(400).json(loginErrors)

    }

    const {email, password} = loginInputs;

    const deliveryUser = await DeliveryUser.findOne({email: email})

    if(deliveryUser){

        const validation = await ValidatePassword(password, deliveryUser.password,deliveryUser.salt);

        if(validation){

            const signature = await GenerateSignature({
             
            _id: (deliveryUser as any)._id.toString(),
            email: deliveryUser.email,
            verified: deliveryUser.verified

        })
        // send the request to the client side
        return res.status(201).json({
            signature: signature,
            verified: deliveryUser.verified,
            email: deliveryUser.email
        })
    }
    }
        return res.status(404).json({message: 'Login Error'});

}


export const GetDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUser = req.user;

    if(deliveryUser) {
        const profile = await DeliveryUser.findById(deliveryUser._id);
        if(profile) {
            return res.status(200).json(profile);
        }
    }

    return res.status(404).json({message: 'Profile not found'});
}


export const EditDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUser = req.user;

    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
    
    const profileErrors = await validate(profileInputs, {validationError: {target: false}});

    if(profileErrors.length > 0) {
        return res.status(400).json(profileErrors);
    }

    const {firstName, lastName, address} = profileInputs;

    if(deliveryUser) {

        const profile = await DeliveryUser.findById(deliveryUser._id)


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

export const UpdateDeliveryUserStatus = async (req: Request, res: Response, next: NextFunction) =>{

    const deliveryUser = req.user;

    if(deliveryUser){
        const {lat, lng} = req.body;

        const profile = await DeliveryUser.findById(deliveryUser._id);

        if(profile){

            if(lat && lng){
                profile.lat = parseFloat(lat);;
                profile.lng = parseFloat(lng);;
            }

            profile.isAvailable = !profile.isAvailable;

            const result = await profile.save();

            return res.status(200).json(result);

        }
    }

            return res.status(400).json({ message : 'Error with update status'});

}
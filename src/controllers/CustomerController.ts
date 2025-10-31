import express, {Response, Request, NextFunction} from 'express';

import {plainToClass} from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomerInputs, UserLoginInputs,  EditCustomerProfileInputs  } from '../dto/Customer.dto';
import { GenerateOTP, GeneratePassword, GenerateSalt, GenerateSignature, onRequestOTP, SendVerificationEmail, ValidatePassword } from '../utility';
import { Customer } from '../models/Customer';

export const CustomerSignup = async (req: Request, res: Response, next: NextFunction) => {

    const customerInputs = plainToClass(CreateCustomerInputs, req.body);

    const inputErrors = await validate(customerInputs, {validationError: {target: true}});
    if(inputErrors.length > 0){
        return res.status(400).json(inputErrors);
    }

    // Proceed with customer creation logic
    // ...

    const { email, phone, password } = customerInputs;

    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    const { otp, expiry } = GenerateOTP();

    const existCustomer = await Customer.findOne({ email: email });

    if(existCustomer){
        return res.status(409).json({message: 'Customer with this email already exists'});
    }


    const result = (await Customer.create({
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
        lng: 0
    }))

    if(result){

        // send OTP to user phone number

        // await onRequestOTP(otp, phone);

        await SendVerificationEmail(email, otp); // <-- New line added

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

    return res.status(400).json({message: 'error with otp validation'});
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
            await onRequestOTP(otp, profile.phone);

            return res.status(200).json({message: 'OTP sent successfully'});

        }
    }

    return res.status(400).json({message: 'error with otp request'});
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

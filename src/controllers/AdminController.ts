import { Request, Response, NextFunction } from 'express';
import { CreateVandorInput } from '../dto';
import { DeliveryUser, Transaction, Vandor } from '../models';
import { GeneratePassword, GenerateSalt } from '../utility';


export const FindVandor = async (id: string | undefined, email?: string): Promise<any | null> => {

    if(email){
        return await Vandor.findOne({ email: email})
    }else{
        return await Vandor.findById(id);
    }

}

export const CreateVandor =async(req: Request, res: Response, next: NextFunction) => {

const { name, address, pincode, foodType, email, password, ownerName, phone }  = <CreateVandorInput>req.body;



    const existingVandor = await FindVandor('', email);

    if(existingVandor !== null){
        return res.json({ "message": "A vandor is exist with this email ID"})
    }
// generate a salt
    const salt =  await GenerateSalt()
    const userPassword = await GeneratePassword(password, salt);

// encrypt the password using the salt


    const createdVandor =  await Vandor.create({
        name: name,
        address: address,
        pincode: pincode,
        foodType: foodType,
        email: email,
        password: userPassword,
        salt: salt,
        ownerName: ownerName,
        phone: phone,
        rating: 0,
        serviceAvailable: false,
        coverImages: [],
        foods: [],
        lat: 0,
        lng: 0
    })

return res.json(createdVandor);
}


export const GetVandors =async(req: Request, res: Response, next: NextFunction) => {

     const vandors = await Vandor.find()

    if(vandors !== null){
        return res.json(vandors)
    }
  return res.json({"message": "Vendors data not available"})

}


export const GetVandorById =async(req: Request, res: Response, next: NextFunction) => {

    const vandorId = req.params.id;

     const vandor = await FindVandor(vandorId);
    if(vandor !== null){
        return res.json(vandor)
    }
  return res.json({"message": "Vendor data not available"})
}

export const GetTransactions =async(req: Request, res: Response, next: NextFunction) => {


     const transactions = await Transaction.find();
    if(transactions){
        return res.status(200).json(transactions);
    }
  return res.json({"message": "Transactions not available"})
}

export const GetTransactionById =async(req: Request, res: Response, next: NextFunction) => {

    const id = req.params.id;

     const transaction = await Transaction.findById(id);
    if(transaction){
        return res.status(200).json(transaction);
    }
  return res.json({"message": "Transaction not available"})
}

export const VerifyDeliveryUser = async(req: Request, res: Response, next: NextFunction) =>{
    const {_id, status} = req.body;

    if(_id){

        const profile = await DeliveryUser.findById(_id);

        if(profile){

            profile.verified = status;

            const result = await profile.save();

            return res.status(200).json(result);
        }
    }
    return res.status(400).json({"message": "unable to verify delivery user"})
}

export const GetDeliveryUsers = async(req: Request, res: Response, next: NextFunction) =>{
   
        const deliveryUsers = await DeliveryUser.find();

        if(deliveryUsers){

            return res.status(200).json(deliveryUsers);
        }
    return res.status(400).json({"message": "unable to verify delivery user"})
}
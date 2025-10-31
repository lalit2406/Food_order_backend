import { EditVandorInputs, VandorLoginInputs } from "../dto";
import { CreateFoodInputs } from "../dto";
import { Food } from "../models";
import { GenerateSignature, ValidatePassword } from "../utility";
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
// res.setHeader('Authorization', await signature);
// return res.json({ token: signature });

        //  return res.json(signature);
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

            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename);

            vandor.coverImages.push(...images);
            
            const result = await vandor.save();
            
            return res.json({ result });
        }
    }

    return res.json({ message: "Vandor info not found" });

}

export const UpdateVandorService = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

if (user) {

    const existingVandor = await FindVandor(user._id);
    if(existingVandor){
        existingVandor.serviceAvailable = !existingVandor.serviceAvailable;

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

//             const files = req.files as [Express.Multer.File] | undefined;
// const images = Array.isArray(files) ? files.map((file: Express.Multer.File) => file.filename) : [];
            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename);

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
import bcrypt from 'bcrypt';
import  jwt   from 'jsonwebtoken';
import { VandorPayload } from '../dto';
import { Config } from '../config';
import { AuthPayload } from '../dto/Auth.dto';
import { Request } from 'express';


export const GenerateSalt = async () => {

    return await bcrypt.genSalt();
};





export const GeneratePassword = async (password: string, salt: string) => {

    return await bcrypt.hash(password, salt);

}

export const ValidatePassword = async (enteredPassword: string, savedPassword: string, salt: string) => {
    return await GeneratePassword(enteredPassword, salt) === savedPassword;
}


export const GenerateSignature = async (payload: AuthPayload) => {

    return jwt.sign(payload, Config.APP_SECRET, { expiresIn: '98d' });

}


export const ValidateSignature = async (req: Request) => {

    const signature = req.get('Authorization');
    if (signature) {
        const token = signature.split(' ')[1];
        if (token) {
            const payload = jwt.verify(token, Config.APP_SECRET) as unknown as AuthPayload;
            req.user = payload;
            return true;
        }
    }
    return false;
}
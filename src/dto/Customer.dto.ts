
import { IsEmail, IsEmpty, Length } from 'class-validator';

export class CreateCustomerInputs{

    @IsEmail()
    email!: string;

    @Length(7,12)
    phone: string;

    @Length(4,20)
    password: string;


}

export class UserLoginInputs{

    @IsEmail()
    email!: string;

    @Length(4,20)
    password: string;


}


export class EditCustomerProfileInputs{

    @Length(3,16)
    firstName: string;

    @Length(3,16)
    lastName: string;

    @Length(4,20)
  address: string;


}


export interface CustomerPayload{
    _id:string;
    email:string;
    verified:boolean;   
}
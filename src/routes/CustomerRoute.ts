import express, {Request, Response, NextFunction} from 'express';
import { CustomerLogin, CustomerSignup, CustomerVerify, EditCustomerProfile, GetCustomerProfile, RequestOTP,  } from '../controllers';
import { Authenticate } from '../middlewares';

const router = express.Router();

// ------------------Signup/ create customer---------------------//
router.post('/signup', CustomerSignup)

// ----------------------Login---------------------//

router.post('/login', CustomerLogin)

// authentication middleware
router.use(Authenticate);
// ------------------verify  customer account---------------------//

router.patch('/verify', CustomerVerify)
// ------------------OTP / requesting OTP---------------------//

router.post('/otp', RequestOTP)
// ------------------Profile---------------------//

router.get('/profile', GetCustomerProfile)

router.patch('/profile', EditCustomerProfile)


// Cart
// Order
// Payment



export{ router as CustomerRoute};
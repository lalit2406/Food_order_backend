import express, {Request, Response, NextFunction} from 'express';
import { CreateOrder, CustomerLogin, CustomerSignup, CustomerVerify, EditCustomerProfile, GetCustomerProfile, GetOrderById, GetOrders, RequestOTP, AddToCart, GetCart , VerifyOffer, DeleteCart, CreatePayment } from '../controllers';
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
router.post('/cart', AddToCart)
router.get('/cart', GetCart)
router.delete('/cart', DeleteCart)

// apply offers
router.get('/offer/verify/:id', VerifyOffer)

// Payment
router.post('/create-payment', CreatePayment)

// Order

router.post('/create-order', CreateOrder)
router.get('/orders', GetOrders)
router.get('/order/:id', GetOrderById)




export{ router as CustomerRoute};
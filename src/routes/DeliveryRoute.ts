import express, {Request, Response, NextFunction} from 'express';
import {DeliveryUserSignup, DeliveryUserLogin, UpdateDeliveryUserStatus, GetDeliveryUserProfile, EditDeliveryUserProfile} from '../controllers';
import { Authenticate } from '../middlewares';

const router = express.Router();

// ------------------Signup/ create customer---------------------//
router.post('/signup', DeliveryUserSignup)

// ----------------------Login---------------------//

router.post('/login', DeliveryUserLogin)

// authentication middleware
router.use(Authenticate);

// ----------------change status ---------//

router.put('/change-status', UpdateDeliveryUserStatus);
// ------------------Profile---------------------//

router.get('/profile', GetDeliveryUserProfile)

router.patch('/profile', EditDeliveryUserProfile)



export{ router as DeliveryRoute};
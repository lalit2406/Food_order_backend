import express, { Request, Response, NextFunction } from 'express';
import { AddFood, GetFoods, GetVandorProfile, UpdateVandorCoverImage, UpdateVandorProfile, UpdateVandorService, VandorLogin,GetCurrentOrders, ProcessOrder, GetOrderDetails, GetOffers, AddOffer, EditOffer } from '../controllers';
import { Authenticate } from '../middlewares';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const UPLOAD_DESTINATION = path.join(__dirname,'..', 'images');

const imageStorage = multer.diskStorage({
    destination: function (req, file, cb)  {
        cb(null, UPLOAD_DESTINATION);
    },
    filename: function (req, file, cb) {
       const safeDate = new Date().toISOString().replace(/:/g, '-');
        cb(null, safeDate + '-' + file.originalname);
    }

});

const images = multer({ storage: imageStorage }).array('images', 10);



router.post('/login', VandorLogin);

router.use(Authenticate);
router.get('/profile', GetVandorProfile);
router.patch('/profile', UpdateVandorProfile);
router.patch('/coverimage',images, UpdateVandorCoverImage);
router.patch('/service', UpdateVandorService);

router.post('/food',images, AddFood);
router.get('/foods', GetFoods);

// ORDERS
router.get('/orders',GetCurrentOrders);
router.put('/order/:id/process',ProcessOrder);
router.get('/order/:id',GetOrderDetails);

// offers
router.get('/offers', GetOffers);
router.post('/offer', AddOffer);
router.put('/offer/:id', EditOffer);
// delete offer

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({message: "Hello from Vandor"});
});


export {router as VandorRoute
};
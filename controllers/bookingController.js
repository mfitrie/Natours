const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const Stripe = require('stripe');



const getCheckoutSession = async (req,res,next)=>{

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // console.log(tour);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // this is not secure URL, just using for this course
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                // amount is expected to be in cents 
                amount: tour.price * 100,
                currency: 'myr',
                quantity: 1
            }
        ]
    });

    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    });
}


const createBookingCheckout = catchAsync(async (req, res, next)=>{
    // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
    const {tour, user, price} = req.query;

    if(!tour && !user && !price){
        return next();
    }

    await Booking.create({
        tour, 
        user, price
    });

    res.redirect(req.originalUrl.split('?')[0]);
});


const createBooking = factory.createOne(Booking);
const getBooking = factory.getOne(Booking);
const getAllBookings = factory.getAll(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);


module.exports = {getCheckoutSession, createBookingCheckout, createBooking, getBooking, getAllBookings, updateBooking, deleteBooking}
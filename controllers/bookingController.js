const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
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
        // // this is not secure URL, just using for this course
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,

        // add alert at the query string = alert=booking
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        mode: 'payment',
        line_items: [
            {
                quantity: 1,
                price_data:{
                    currency: 'myr',
                    // amount is expected to be in cents 
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                    }

                }
            }
        ]
    });

    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    });
}


// const createBookingCheckout = catchAsync(async (req, res, next)=>{
//     // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//     const {tour, user, price} = req.query;

//     if(!tour && !user && !price){
//         return next();
//     }

//     await Booking.create({
//         tour, 
//         user, price
//     });

//     res.redirect(req.originalUrl.split('?')[0]);
// });



const createBookingCheckout = async session =>{
    const tour = session.client_reference_id;
    const user = (await User.findOne({email: session.customer_email})).id;
    // const price = session.line_items[0].amount / 100;
    const price = session.amount_total / 100;

    await Booking.create({
        tour, 
        user, 
        price
    });
}



// from 'stripe'
const webhookCheckout = (req, res, next)=>{
    const signature = req.headers['stripe-signature'];

    let event;
    try{
        // the req.body must be in a raw form
        event = Stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    }catch(err){
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if(event.type === 'checkout.session.completed'){
        createBookingCheckout(event.data.object);
    }

    res.status(200).json({
        received: true
    });

}


const createBooking = factory.createOne(Booking);
const getBooking = factory.getOne(Booking);
// NOTE - The dupplication booking handler is not yet implemented
const getAllBookings = factory.getAll(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);


module.exports = {getCheckoutSession, webhookCheckout, createBooking, getBooking, getAllBookings, updateBooking, deleteBooking}
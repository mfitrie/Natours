const {Review} = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');



// const getAllReviews = catchAsync(async (req, res, next) =>{
//     // if filter is empty, it will return all the reviews
//     // if filter has id, it will return the id and find the id
//     let filter = {};

//     if(req.params.tourId){
//         filter = {
//             tour: req.params.tourId
//         }
//     }

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data:{
//             reviews
//         }
//     });
// });


const getAllReviews = factory.getAll(Review);


const setTourUserIds = (req, res, next) =>{
    // Allow nested routes
    if(!req.body.tour){
        req.body.tour = req.params.tourId;
    }
    if(!req.body.user){
        req.body.user = req.user.id;
    }

    next();
}

// const createReview = catchAsync(async(req, res, next)=>{
//     // Allow nested routes
//     // if we didnt specify the tour, we specify the tour

//     // if(!req.body.tour){
//     //     req.body.tour = req.params.tourId;
//     // }
//     // if(!req.body.user){
//     //     req.body.user = req.user.id;
//     // }

//     const newReview = await Review.create(req.body);
    
//     res.status(201).json({
//         status: 'success',
//         data:{
//             review: newReview
//         }
//     });
// });

const createReview = factory.createOne(Review);

const getReview = factory.getOne(Review);


const updateReview = factory.updateOne(Review)
const deleteReview = factory.deleteOne(Review);



module.exports = {getAllReviews, getReview, createReview, deleteReview, updateReview, setTourUserIds};
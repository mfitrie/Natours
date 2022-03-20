const mongoose = require('mongoose');
const Tour = require('../models/tourModel');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        require: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }

}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});



// INDEX
// prevent duplicate review
reviewSchema.index({tour: 1, user: 1}, {unique: true});


// prefind middleware
reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
})


// static method for mongoDB
// statistic for ratingsAverage
// this function will available at the model
reviewSchema.statics.calcAverageRatings = async function(tourId){
    console.log(tourId);

    // 'this' point to current model
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ]);

    // console.log(stats);

    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    }else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
}

// we need to use 'post' and not 'pre'
// because only after the document is already saved to DB it make sense to calculate
reviewSchema.post('save', function(){
    // this point to current review

    // 'constructor' is the model who created the document
    this.constructor.calcAverageRatings(this.tour)

});


// regex to 'findOneAndUpdate' and 'findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne()
    // console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne(); does NOT work here, query has already executed

    // static method from above
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = {Review};
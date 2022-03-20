const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

// CREATE DATABASE SCHEMA
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize:{
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a group size'],
        enum: {
            // enum only for string
            values: ['easy','medium','difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        // set function will run each time that there is a new value for ratingsAverage
        set: val => Math.round(val * 10) / 10 //4.66666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true,'A tour must have a prioe']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                // this only point to current doc on NEW document creation
                return val < this.price // 100 < 200
            },
            message: 'Discount price ({VALUE}) should be below reqgular price'
        } 
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: { 
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'a tour must have a cover image']
    },
    images: [String],
    createAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    // Embedded documents
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            // It reference to the User
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});


// INDEXING to gain performance
// Never ignore index
// Index the most use query
// '1' is sorting ascending, '-1' is descending order
// tourSchema.index({price: 1})
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
// index for geospatiol need to be 2D sphere index
tourSchema.index({'startLocation.coordinates': '2dsphere'});


// Virtual Properties, cannot be used in query because it is not part in Database
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

// Vitual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    // reference to 'tour' in reviewModel Schema
    foreignField: 'tour',
    // call the current id
    localField: '_id'
});

// We can have a middleware running before and after a certain event 
// DOCUMENT MIDDLERWARE: runs before .save() and .create()
tourSchema.pre('save', function(next){
    // console.log(this);
    // slug is a string that can be put in url
    this.slug = slugify(this.name, {lower: true});
    next();
});

// tourSchema.pre('save',function(next){
//     console.log('Will save document...');
//     next();
// });

// tourSchema.post('save',function(doc,next){
//     console.log(doc);
//     next();
// });


// PERFORMIN EMBEDDING, test
// tourSchema.pre('save', async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });



// QUERY MIDDLEWARE
// point at current query, not at current document

// tourSchema.pre('find', function(next){

// the regex trigger for all command start with the name find
tourSchema.pre(/^find/, function(next){
    // 'this' is point to query
    this.find({secretTour: {$ne: true}});

    this.start = Date.now();
    next();
});


tourSchema.pre(/^find/, function(next){
    // we can populate the data from 'guide' in tourModel
    this.populate({
        path: 'guides',
        // hide this data
        select: "-__v -passwordChangedAt"
    });
    next();
});


// this middleware will run after the query is executed
tourSchema.post(/^find/, function(docs, next){
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);

    // console.log(docs);
    next();
});



// // AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//     // 'this' will point to the current aggregation object

//     this.pipeline().unshift({
//         $match: {secretTour: {$ne: true}}
//     });

//     console.log(this.pipeline());

//     next();
// })


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
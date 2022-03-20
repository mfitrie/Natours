// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const { query } = require('express');

const Tour = require('../models/tourModel');

// HANDLE ERROR IN ASYNC FUNCTION, catchAsync.js file
// The catch 'next' will end up in error handling global middleware
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');



/////////// MULTER ///////////
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback)=>{
    if(file.mimetype.startsWith('image')) {
        // pass true if it is file as intended
        callback(null, true);
    }else{
        callback(new AppError('Not an image! Please upload only images', 400), false);
    }
}

const upload = multer({
    // dest: 'public/img/users'
    storage: multerStorage,
    fileFilter: multerFilter
});


// upload multiple image
// req.files
const uploadTourImages = upload.fields([
    {
        name: 'imageCover', 
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
]);

// upload.single('image') req.file
// upload.array('images',5) req.files
/////////// MULTER ///////////


const resizeTourImages = catchAsync(async (req, res, next)=>{
    // console.log(req.files);

    if(!req.files.imageCover && !req.files.images){
        return next();
    }

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);

    
    // 2) Images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) =>{
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;

        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    })
    );

    next();
})





// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));


// const checkID = (req,res,next,val)=>{
//     console.log(`Tour is is: ${val}`);

//     if(req.params.id * 1 > tours.length){
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }
//     next();
// }


// const checkBody = (req,res,next)=>{
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing name or price'
//         });
//     }

//     next();
// }


const aliasTopTours = (req,res,next) =>{
    // filling before the getAllTours
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}





// const getAllTours = catchAsync(async (req, res, next)=>{

//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//     const tours = await features.queryMongo;
//     // const tours = await query;


//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
    
//     // try{
//     //     //////// Filter the data ////////
//     //     // 1) Filtering
//     //     // const queryObj = {...req.query};
//     //     // const excludedFields = ['page','sort','limit','fields'];
//     //     // excludedFields.forEach(el => {
//     //     //     return delete queryObj[el];
//     //     // });
        
//     //     // // const tours = await Tour.find()
//     //     // // .where('duration')
//     //     // // .equals(5)
//     //     // // .where('difficulty')
//     //     // // .equals('easy');
        

        
//     //     // // 2) Advance filtering
//     //     // let queryStr = JSON.stringify(queryObj);
//     //     // // using regex to replace
//     //     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => {
//     //     //     return `$${match}`;
//     //     // });

//     //     // console.log(JSON.parse(queryStr));

//     //     // let query = Tour.find(JSON.parse(queryStr));
//     //     // // { difficulty: 'easy', duration: { gte: '5' } }
//     //     // // gte, gt, lte, lt
        



//     //     // // 3) Sorting
//     //     // if(req.query.sort){
//     //     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     //     // sort('price ratingsAverage');

//     //     //     console.log(sortBy);

//     //     //     // sort the query based on price
//     //     //     query = query.sort(req.query.sort);
//     //     // }else{
//     //     //     // sort based on date created
//     //     //     query = query.sort('-createdAt');
//     //     // }


//     //     // // 4) Field Limiting
//     //     // if(req.query.fields){
//     //     //     const fields = req.query.fields.split(',').join(' ');
//     //     //     // query = query.select('name duration price');
//     //     //     query = query.select(fields);
//     //     // }else{
//     //     //     // - is exclude in mongose
//     //     //     query = query.select('-__v');
//     //     // }

//     //     //////// Filter the data ////////


//     //     // 5) Pagination
        
//     //     // // default result is 1
//     //     // const page = req.query.page * 1 || 1;
//     //     // // default limit is 100
//     //     // const limit = req.query.limit * 1 || 100;
//     //     // const skip = (page - 1) * limit;


//     //     // // page=2&limit=10, 1-10, page 1, 11-20, page 2
//     //     // query = query.skip(skip).limit(limit);


//     //     //////// CODE PROBLEM IN AWAIT THE DOCUMENT ////////
//     //     // if(req.query.page){
//     //     //     // number of document
//     //     //     const numTours = await Tour.countDocument();
//     //     //     console.log(`numTours: ${numTours}`);
//     //     //     if(skip >= numTours) {
//     //     //         throw new Error('This page does not exist');
//     //     //     }
//     //     // }
//     //     //////// CODE PROBLEM IN AWAIT THE DOCUMENT ////////

//     //     // EXECUTE QUERY
//     //     const features = new APIFeatures(Tour.find(), req.query)
//     //     .filter()
//     //     .sort()
//     //     .limitFields()
//     //     .paginate();

//     //     const tours = await features.queryMongo;
//     //     // const tours = await query;


//     //     // SEND RESPONSE
//     //     res.status(200).json({
//     //         status: 'success',
//     //         results: tours.length,
//     //         data: {
//     //             tours
//     //         }
//     //     });
//     // }catch(err){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }

    
// });


const getAllTours = factory.getAll(Tour);



// const getTour = catchAsync(async (req, res, next)=>{

//     const tour = await Tour.findById(req.params.id).populate('reviews');
//         // Tour.findOne({_id: req.params.id});

//     if(!tour){
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data:{
//             tour
//         }
//     });


//     // try{
//     //     const tour = await Tour.findById(req.params.id);
//     //     // Tour.findOne({_id: req.params.id});

//     //     res.status(200).json({
//     //         status: 'success',
//     //         data:{
//     //             tour
//     //         }
//     //     })
//     // }catch(err){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }

//     // // console.log(req.params);
//     // // const id = parseInt(req.params.id);
    
//     // // const tour = tours.find(el=>{
//     // //     return el.id === id;
//     // // });

//     // // if(!tour){
//     // //     return res.status(404).json({
//     // //         status:'fail',
//     // //         message: 'Invalid ID'
//     // //     });
//     // // }


//     // // res.status(200).json({
//     // //     status: 'success',
//     // //     data: {
//     // //         tour
//     // //     }
//     // // });
// });



const getTour = factory.getOne(Tour, {path: 'reviews'});




// const createTour = catchAsync(async (req, res, next)=>{
    
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data:{
//             tour: newTour
//         }
//     });


    
//     // try{
//     //     // const newTour = new Tour({});
//     //     // newTour.save();

//     //     const newTour = await Tour.create(req.body);

//     //     res.status(201).json({
//     //         status: 'success',
//     //         data:{
//     //             tour: newTour
//     //         }
//     //     });
//     // }catch(err){
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: err
//     //     });

//     // }
    
// });


const createTour = factory.createOne(Tour);




// const updateTour = catchAsync(async (req, res, next)=>{
    
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });

//     if(!tour){
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });

    
//     // try{
//     //     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //         new: true,
//     //         runValidators: true
//     //     });

//     //     res.status(200).json({
//     //         status: 'success',
//     //         data: {
//     //             tour
//     //         }
//     //     });
//     // }catch(err){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
    
// });



const updateTour = factory.updateOne(Tour);



// const deleteTour = catchAsync(async (req, res, next)=>{

//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if(!tour){
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     // 204 means no content
//     res.status(204).json({
//         status: 'success',
//         data: null
//     });


//     // try{
//     //     await Tour.findByIdAndDelete(req.params.id);

//     //     // 204 means no content
//     //     res.status(204).json({
//     //         status: 'success',
//     //         data: null
//     //     });
//     // }catch(err){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
// });

const deleteTour = factory.deleteOne(Tour);


// Stats for tour
const getTourStats = catchAsync(async (req, res, next)=>{
   
const stats = await Tour.aggregate([
    {
        $match: {ratingsAverage: {$gte: 4.5}}

    },
    {
        $group: {
            // _id: '$ratingsAverage',
            _id: {$toUpper: '$difficulty'},
            numTours: {$sum: 1},
            numRatings: {$sum: '$ratingsQuantity'},
            avgRating: {$avg: '$ratingsAverage'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max: '$price'},
        }
    },
    {
        $sort: {avgPrice: 1}
    },
    // {
    //     $match: {_id: {$ne: 'EASY'}}
    // },
]);

res.status(200).json({
    status: 'success',
    data: {
        stats
    }
});


   
    // try{
    //     const stats = await Tour.aggregate([
    //         {
    //             $match: {ratingsAverage: {$gte: 4.5}}

    //         },
    //         {
    //             $group: {
    //                 // _id: '$ratingsAverage',
    //                 _id: {$toUpper: '$difficulty'},
    //                 numTours: {$sum: 1},
    //                 numRatings: {$sum: '$ratingsQuantity'},
    //                 avgRating: {$avg: '$ratingsAverage'},
    //                 avgPrice: {$avg: '$price'},
    //                 minPrice: {$min: '$price'},
    //                 maxPrice: {$max: '$price'},
    //             }
    //         },
    //         {
    //             $sort: {avgPrice: 1}
    //         },
    //         // {
    //         //     $match: {_id: {$ne: 'EASY'}}
    //         // },
    //     ]);

    //     res.status(200).json({
    //         status: 'success',
    //         data: {
    //             stats
    //         }
    //     });
    // }catch(err){
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     });
    // }
});


const getMonthlyPlan = catchAsync(async (req, res, next)=>{

    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group:{
                _id: {$month: '$startDates'},
                numTourStarts: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            // 0, means hide
            // 1, means show
            $project: {
                _id: 0
            }
        },
        {
            $sort: {numberTourStarts: -1}
        },
        {
            // limit the result
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });


    // try{
    //     const year = req.params.year * 1; // 2021

    //     const plan = await Tour.aggregate([
    //         {
    //             $unwind: '$startDates'
    //         },
    //         {
    //             $match: {
    //                 startDates: {
    //                     $gte: new Date(`${year}-01-01`),
    //                     $lte: new Date(`${year}-12-31`),
    //                 }
    //             }
    //         },
    //         {
    //             $group:{
    //                 _id: {$month: '$startDates'},
    //                 numTourStarts: {$sum: 1},
    //                 tours: {$push: '$name'}
    //             }
    //         },
    //         {
    //             $addFields: {month: '$_id'}
    //         },
    //         {
    //             // 0, means hide
    //             // 1, means show
    //             $project: {
    //                 _id: 0
    //             }
    //         },
    //         {
    //             $sort: {numberTourStarts: -1}
    //         },
    //         {
    //             // limit the result
    //             $limit: 12
    //         }
    //     ]);

    //     res.status(200).json({
    //         status: 'success',
    //         data: {
    //             plan
    //         }
    //     });

    // }catch(err){
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     });
    // }
});




// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
const getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;

    const [lat, lng] = latlng.split(',');

    // 3963.2 is radius of earth in miles
    // 6378.1 is radius of earth in km
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng){
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    }

    // console.log(distance, lat, lng, unit);

    // using geospatial function from mongoDB
    const tours = await Tour.find(
        {
            startLocation: 
            {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radius]
                }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});



const getDistances = catchAsync(async(req, res, next) =>{
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng){
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    }

    // geospatial aggregation only have 1 single stage, geoNear
    // it must at the first stage
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng *1, lat *1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            // '$project' is to show only the field we want to show
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);


    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });

});


module.exports = {uploadTourImages, resizeTourImages, getAllTours, aliasTopTours, getTour, createTour, updateTour, deleteTour, getTourStats, getMonthlyPlan, getToursWithin, getDistances};
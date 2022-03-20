const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');


// this work for every model
// passing the model 
const deleteOne = Model => catchAsync(async (req, res, next)=>{

    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next(new AppError('No document found with that ID', 404));
    }

    // 204 means no content
    res.status(204).json({
        status: 'success',
        data: null
    });
});



const updateOne = Model => catchAsync(async (req, res, next)=>{
    
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if(!doc){
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});



const createOne = Model => catchAsync(async (req, res, next)=>{
    
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data:{
            data: doc
        }
    });
});


const getOne = (Model, popOptions) => catchAsync(async (req, res, next)=>{
    
    let query = Model.findById(req.params.id);

    if(popOptions){
        query.populate(popOptions);
    }

    const doc = await query;

    if(!doc){
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data:{
            data: doc
        }
    });
});


const getAll = Model => catchAsync(async (req, res, next)=>{
    // if filter is empty, it will return all the reviews
    // if filter has id, it will return the id and find the id
    
    // To allow for nested GET reviews on tour (hack)
    let filter = {};

    if(req.params.tourId){
        filter = {
            tour: req.params.tourId
        }
    }

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

    const doc = await features.queryMongo;
    // // 'explain' is to show the stats of mongoDB query
    // const doc = await features.queryMongo.explain();
    // const tours = await query;


    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });
});



module.exports = {deleteOne, updateOne, createOne, getOne, getAll};

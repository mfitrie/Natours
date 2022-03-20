const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');


/////////// MULTER ///////////
// Multer, upload file
// const multerStorage = multer.diskStorage({
//     destination: (req, file, callback) =>{
//         // callback such as next()
//         // first parameter is error, second is actual destination
//         callback(null, 'public/img/users');
//     },
//     filename: (req, file, callback)=>{
//         // user-userid-timestamp.jpeg
//         // split the 'image/jpeg' to 'jpeg'
//         const extension = file.mimetype.split('/')[1];
//         callback(null, `user-${req.user.id}-${Date.now()}.${extension}`);

//     }
// });

// save multer to memory storage, the image will be stored as a buffer
// used this to work with 'sharp'
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

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next)=>{
    if(!req.file){
        return next();
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // image processor to resize the image
    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);

    next();
});
/////////// MULTER ///////////





const filterObj = (obj, ...allowedFields)=>{
    const newObj = {};

    // Object.keys is to loop the object
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });
    return newObj;
}

// const getAllUsers = catchAsync(async (req,res,next)=>{

//     const users = await User.find();

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//             users
//         }
//     });
// });


const getAllUsers = factory.getAll(User);


const getMe = (req, res, next)=>{
    req.params.id = req.user.id;
    next();
}


const updateMe = catchAsync(async(req, res, next)=>{

    // // multer
    // console.log(req.file);
    // console.log(req.body);

    // 1) Create error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
    }


    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    // if the req has file, which is if the user wants to change the profile picture
    if(req.file){
        filteredBody.photo = req.file.filename;
    }
    
    // 3) Update user document
    // we dont use 'save' because it will trigger the required field, we just want to change non sensitive data
    // use (findByIdAndUpdate) instead of (findById then 'save')
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, 
        runValidators: true
    });


    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// we not delete the user, we make the user inactive
const deleteMe = catchAsync(async (req, res, next)=>{
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    });
})

// const getUser = (req,res)=>{
//     res.status(500).json({
//         status: 'Error',
//         message: 'This route is not yet defined'
//     });
// }

const getUser = factory.getOne(User);

const createUser = (req,res)=>{
    res.status(500).json({
        status: 'Error',
        message: 'This route is not yet defined! Please use /signup instead'
    });
}

// const updateUser = (req,res)=>{
//     res.status(500).json({
//         status: 'Error',
//         message: 'This route is not yet defined'
//     });
// }


// Do NOT update passwords with this!
const updateUser = factory.updateOne(User);


// const deleteUser = (req,res)=>{
//     res.status(500).json({
//         status: 'Error',
//         message: 'This route is not yet defined'
//     });
// }

const deleteUser = factory.deleteOne(User);


module.exports = {uploadUserPhoto, resizeUserPhoto, getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe, deleteMe, getMe};
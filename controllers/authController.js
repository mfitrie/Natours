const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {Email} = require('../utils/email');




const signToken = id =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        // Specifies JWT expired
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res)=>{
    const token = signToken(user._id);

    // set the jwt to cookie
    const cookieOptions = {
        // change jwt expires to milisecond
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true,
        httpOnly: true,
    }

    if(process.env.NODE_ENV === 'production'){
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);


    // Remove the password from output
    user.password = undefined;
    
    // 201 is for created
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}



const signUp = catchAsync(async (req, res, next) =>{
    // const newUser = await User.create(req.body);

    // We only allow data that actually needed
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();


    createSendToken(newUser, 201, res);

    
});



const login = catchAsync(async (req,res,next)=>{
    const {email, password} = req.body;

    // 1) Check if email and password exist
    if(!email || !password){
        // after calling the next middleware, we want to make sure the login function is finishes
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    // we use '+password' because in schema, we make select: false
    // select is used to select a couple of field from DB only once we needed
    const user = await User.findOne({email}).select('+password');

    if(!user || !(await user.correctPassword(password, user.password))){
        // 401 is unautorized
        return next(new AppError('Incorrect email or password', 401));
    }


    // 3) If everything ok, send token to client
    // 'user._id' is a payload
    createSendToken(user, 200, res);
});


const logout = (req, res) =>{
    // specify the name of jwt same as login from function 'createSendToken' to overide, which is 'jwt'
    res.cookie('jwt','loggedout', {
        // 10 second
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    })
}


const protect = catchAsync(async (req, res, next) =>{
    // NOTES: to logout the user, delete cookies

    // 1) Getting token and check of it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        // authorization headers
        token = req.headers.authorization.split(' ')[1];
    } 
    // else if(req.cookies.jwt){
    //     // look jwt in cookies
    //     token = req.cookies.jwt
    // }   
    else if(req.cookies.jwt && req.cookies.jwt !== 'loggedout'){
        token = req.cookies.jwt;
    }

    // console.log(token);

    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access', 401));
    }


    // 2) Verification token
    // use util library to promisify
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);


    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user changed password after the token was issued
    // 'iat' means issued at
    // 'changedPasswordAfter()' is from userModel.js, it is a instance method
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again', 401));
    }


    // GRANT ACCESS TO PROTECTED ROUTE
    // assign the current user to req.user, means pass data from one middleware to other middleware
    req.user = currentUser;
    // for PUG template
    res.locals.user = currentUser;
    next();
});


// Only for rendered pages, no errors!
const isLoggedIn = async (req, res, next) =>{

    try{

        if(req.cookies.jwt){
            // 1) Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // console.log(decoded);
    
    
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if(!currentUser){
                return next();
            }
    
            // 3) Check if user changed password after the token was issued
            // 'changedPasswordAfter()' is from userModel.js, it is a instance method
            if(currentUser.changedPasswordAfter(decoded.iat)){
                return next();
            }
    
    
            // THERE IS A LOGGED IN USER
    
            // Pug template to be used, specifiend the variable to Pug
            res.locals.user = currentUser;
            return next();
        }

    }catch(err){
        return next();
    }

    // if no cookie
    next();
}


// create a wrapper function to middleware
const restrictTo = (...roles) => {
    return (req, res, next) =>{
        // roles ['admin, 'lead-guide']. role='user'
        if(!roles.includes(req.user.role)){
            // 403 means forbidden
            return next(new AppError('You do not have permission to perform this action',403));
        }

        next();
    }
}


const forgotPassword = catchAsync(async(req, res, next) =>{

    // 1) Get user based on Posted email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('There is no user with email address.',404));
    }


    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    // validate before save is ignore the validation of DB schema
    await user.save({validateBeforeSave: false});


    // 3) Send it to user's email
    // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \nIf you didn't forget your password, please ignore this email!!`;

    try{
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (valid for 10 min)',
        //     message
        // });

        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!!'
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        console.error(err);
        return next(new AppError('There was an error sending the email. Try agin later!', 500));

    }
    

});

const resetPassword = catchAsync(async (req, res, next)=>{
    // 1) Get user based on the token
    // update, means for the string we want to hash
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        // check the token if it is expired or not
        passwordResetExpires: { $gt: Date.now() }
    });



    // 2) If token has not expired, and there is user, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // we use 'SAVE' instead of 'UPDATE' because we want to run with validator
    await user.save();



    // 3) Update changePasswordAt property for the user
    



    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);

});



const updatePassword = catchAsync(async(req, res, next)=>{
    // 1) Get user from collection
    // explicitly asked for password, because at schema for password we make select: false
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if posted current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!



    // 4) Log user in, send JWT
    createSendToken(user, 200, res);

});


module.exports = {signUp, login, logout, protect, isLoggedIn, restrictTo, forgotPassword, resetPassword, updatePassword};
const AppError = require('../utils/appError');

// also operational error message for update, delete, create tour
const handlerCastErrorDB = (err) =>{
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}


const handleDuplicateFieldsDB = (err)=>{
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`;
    return new AppError(message, 400);
}


const handleValidationErrorDB = (err)=>{
    const errors = Object.values(err.errors).map(el=> el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = ()=>{
    return new AppError('Invalid token, Please login again!', 401);
}

const handleJWTExpiredError = ()=>{
    return new AppError('Your token has expired! Please log in again!',401);
}

const sendErrorDev = (err, req, res) => {
    // A) API
    // originalUrl means an entire url but not with the host
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // B) RENDERED WEBSITE
    console.error('ERROR!!', err);
    // give the error message to error page
    return res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: err.message
    });
    

}

const sendErrorProd = (err, req, res)=>{
    // A) API
    if(req.originalUrl.startsWith('/api')){
        // A) Operational, trusted error: send message to client
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
    
        }
        
        // B) Programming or other unknown error: don't leak error details
        // 1) Log error
        console.error('ERROR!!', err);
        
        // 2) Send generic message
        return res.status(500).json({
            status:'error',
            message: 'Something went very wrong!'
        });
        

    }


    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if(err.isOperational){
        return res.status(err.statusCode).render('error',{
            title: 'Something went wrong!',
            msg: err.message
        });

    }
    
    
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR!!', err);
    
    // 2) Send generic message
    return res.status(err.statusCode).render('error',{
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
    
    


    
}




const globalErrorHandler = (err, req, res, next)=>{

    console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Distinguish between development and production environment
    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res);

    }else if(process.env.NODE_ENV === 'production'){

        // make a copy of err object
        // let error = Object.assign(err)

        let error = {...err};
        error.name = err.name;
        error.message = err.message;

        console.log("ERROR OBJECT: ", error);

        if(error.name === 'CastError'){
            error = handlerCastErrorDB(error);
        }
        if(error.code === 11000){
            error =  handleDuplicateFieldsDB(error);
        }
        if(error.name === 'ValidationError'){
            error = handleValidationErrorDB(error);
        }
        if(error.name === 'JsonWebTokenError'){
            error = handleJWTError();
        }
        if(error.name === 'TokenExpiredError'){
            error = handleJWTExpiredError();
        }
        
        sendErrorProd(error, req, res);   
    }

    // res.status(err.statusCode).json({
    //     status: err.status,
    //     message: err.message
    // });
}


module.exports = globalErrorHandler;
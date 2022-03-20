// 'path' is use to manipulate path name
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();


// need to enable after deploy on 'Heroku'
app.enable('trust proxy');


// Set up pug
// Render dynamic files
app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'));


// 1) GLOBAL MIDDLEWARE

// Implement CORS, allow everywhere
app.use(cors());
// // Example to specify only one website
// app.use(cors({
//     origin: 'https://www.natours.com'
// }));

// http method, options
app.options('*', cors());
// app.options('/api/v1/tours/:id',cors());


// Serving static files //
// no need to use public when need to specify path under public
// because we already specify the 'public' file below
// just /css, /img, /js
app.use(express.static(path.join(__dirname, 'public')));


// Set security HTTP headers
app.use(helmet());







console.log(process.env.NODE_ENV);
// Development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}


// Limit requests from same API
const limiter = rateLimit({
    // max 100 request per hour
    max: 100,
    // in 1 hout
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});

app.use('/api', limiter);


// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));
// receive data from HTML form
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));
// Parse the cookie from client
app.use(cookieParser());


// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// we also can whitelist the parameter, using object
app.use(hpp({
    whitelist: ['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty', 'price']
}));






// app.use((req,res,next)=>{
//     console.log("Hello from the middleware");
//     next();
// });


// it is going to compress all the text that send to client
app.use(compression());



// Test middleware
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    // console.log('Cookies: ', req.cookies);

    next();
})

// app.get('/',(req,res)=>{
//     // res.status(200).end('Hello from the server side!');

//     // content automatically change to application/json
//     res
//     .status(200)
//     .json({message:'Hello from the server side!', app: 'Natours'}); 

// });

// app.post('/',(req,res)=>{
//     res.send('You can post to this endpoint');
// });






// 2) ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id',getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);


// 3) ROUTES

// To render PUG
app.use('/', viewRouter);
// To render PUG


app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


// if router path is wrong
app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // });


    // // we made a error handling
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    // next(err);


    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// Global Error handler
app.use(globalErrorHandler);


// 4) START SERVER
module.exports = app;

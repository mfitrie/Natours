const mongoose = require('mongoose');
const dotenv = require('dotenv');
// dotenv
dotenv.config({
    path: './config.env'
});
// console.log(process.env);

// Handle uncaught exception
process.on('uncaughtException', (err)=>{
    console.log('UNCAUGHT EXCEPTION!! Shutting down.....');
    console.log(err.name, err.message);
    process.exit(1);

});

const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser:true,
    useCreateIndex: true,
    useFindAndModify:false,
    useUnifiedTopology:true
})
.then(con =>{
    console.log("DB connection successful!");
})


//// Node environement ////
// console.log(app.get('env'));
// console.log(process.env);
//// Node environement ////

// 'Heroko' is mandatory to use process.env.PORT to listen the port
const port = process.env.PORT || 3000;
const server = app.listen(port, ()=>{
    console.log(`App running on port ${port}....`);
});


// Handle unhandledRejection globally
process.on('unhandledRejection', err=>{
    console.log('UNHANDLER REJECTION!! Shutting down.....');
    console.log(err.name, err.message);


    server.close(()=>{
        // Shutdown the application, 0 for success, 1 for uncaught exception
        process.exit(1);
    });

});


// when the 'Heroku' use SIGTERM, it will shut down the server
process.on('SIGTERM', ()=>{
    console.log('SIGTERM RECEIVED, Shutting down gracefully');
    server.close(()=>{
        console.log('Process terminated');
    });
});
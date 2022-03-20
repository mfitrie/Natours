const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// CREATE DATABASE SCHEMA

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email:{
        type: String,
        require: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only workd on CREATE and SAVE!!, UPDATE does not work
            validator: function(el){
                return el === this.password; // abc === abc
            },
            message: 'Password are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});



// MongoDB middleware which is 'pre', between getting data and save it to database
// run before new document is save
// for password changed at
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew){
        return next();
    }

    // minus 1 second
    this.passwordChangedAt = Date.now() - 1000;
    next();
});


// sign up process before save to DB, hashing the password
userSchema.pre('save', async function(next){
    // 'this' refer to current document

    // Only run this function if password was actually modified
    if(!this.isModified('password')){
        return next();
    }

    // hash is a async function
    // 12 is reasonable
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();


});


// using regex to looking for word or string that start with 'find'
// any user is inactive will not be find
userSchema.pre(/^find/, function(next){
    // this points to the current query
    this.find({active: {$ne: false}});
    next();
});


// instance method, will be available on all document of certain collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // 'this' is point to current document
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        // 10 is a base 10 number
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp; // 100 < 200
    }

    // False means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    // toString('hex'), convert to hexadecimal string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // encrypted token is in database
    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    // not really not save the document, we just modified
    // it is save at authController.js function forgotPassword
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // make it valid for 10 minute

    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is verplicht'],
        unique: true,
        trim: true,
        minlength: [3, 'Username moet minimaal 3 karakters zijn']
    },
    email: {
        type: String,
        required: [true, 'Email is verplicht'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Gebruik een geldig emailadres']
    },
    password: {
        type: String,
        required: [true, 'Wachtwoord is verplicht'],
        minlength: [6, 'Wachtwoord moet minimaal 6 karakters zijn']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Voorkom dat wachtwoord wordt meegestuurd in queries
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema); 
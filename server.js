require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const User = require('./models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');

const app = express();

// Beveiligingsheaders
app.use(helmet());

// CORS configuratie
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:5501'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: 100 // max 100 requests per IP
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.static('public'));
app.use(express.static('./'));

// Voeg deze debug logging toe
app.use((req, res, next) => {
    console.log('Requested URL:', req.url);
    next();
});

// Expliciete route voor reset-password.html
app.get('/reset-password.html', (req, res) => {
    // Probeer eerst in de root directory
    if (fs.existsSync('./reset-password.html')) {
        res.sendFile('reset-password.html', { root: './' });
    } 
    // Anders probeer in public directory
    else if (fs.existsSync('./public/reset-password.html')) {
        res.sendFile('reset-password.html', { root: './public' });
    } 
    else {
        res.status(404).send('Reset password page not found');
    }
});

// MongoDB connectie met error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Verbonden met MongoDB');
}).catch(err => {
    console.error('MongoDB connectie error:', err);
});

// Middleware voor JWT verificatie
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Toegang geweigerd' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ongeldige token' });
        }
        req.user = user;
        next();
    });
};

// Registratie endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validatie
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht' });
        }

        // Check of gebruiker al bestaat
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Gebruiker bestaat al' });
        }

        // Hash wachtwoord
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Maak nieuwe gebruiker
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: 'Gebruiker succesvol geregistreerd' });
    } catch (error) {
        console.error('Registratie error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validatie
        if (!email || !password) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht' });
        }

        // Zoek gebruiker
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Ongeldige inloggegevens' });
        }

        // Verifieer wachtwoord
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Ongeldige inloggegevens' });
        }

        // Genereer JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Beveiligde route voorbeeld
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Toegang tot beveiligde data', user: req.user });
});

// Email configuratie
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lucvancasteren6@gmail.com', // Vervang dit met je Gmail adres
        pass: 'pvfn zdxo ihgz zqur' // Gebruik een app-specifiek wachtwoord van Google
    }
});

// Test de email verbinding bij het opstarten
transporter.verify(function(error, success) {
    if (error) {
        console.log('Probleem met email configuratie:', error);
    } else {
        console.log('Server is klaar om emails te versturen');
    }
});

// Tijdelijke opslag voor reset tokens (in productie zou je dit in een database opslaan)
const passwordResetTokens = new Map();

// Route voor wachtwoord reset aanvraag
app.post('/api/forgot-password', async (req, res) => {
    console.log('Wachtwoord reset aanvraag ontvangen voor:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email adres is verplicht' });
    }
    
    try {
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        passwordResetTokens.set(resetToken, {
            email,
            expires: Date.now() + 3600000
        });
        
        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        
        const mailOptions = {
            from: 'jouw-email@gmail.com',
            to: email,
            subject: 'Wachtwoord reset aanvraag',
            html: `
                <h1>Wachtwoord Reset</h1>
                <p>U heeft een wachtwoord reset aangevraagd. Klik op onderstaande link om uw wachtwoord te resetten:</p>
                <a href="${resetLink}">Reset mijn wachtwoord</a>
                <p>Deze link is 1 uur geldig.</p>
                <p>Als u geen wachtwoord reset heeft aangevraagd, kunt u deze email negeren.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Reset email verzonden naar:', email);
        
        res.json({ message: 'Reset instructies zijn verzonden naar uw email' });
    } catch (error) {
        console.error('Error bij versturen reset email:', error);
        res.status(500).json({ 
            error: 'Er is een fout opgetreden bij het versturen van de reset email',
            details: error.message 
        });
    }
});

// Route voor het verwerken van de wachtwoord reset
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        const resetData = passwordResetTokens.get(token);
        
        if (!resetData) {
            return res.status(400).json({ error: 'Ongeldige of verlopen reset token' });
        }
        
        if (Date.now() > resetData.expires) {
            passwordResetTokens.delete(token);
            return res.status(400).json({ error: 'Reset token is verlopen' });
        }
        
        // Hash het nieuwe wachtwoord
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update het wachtwoord in de database
        await User.findOneAndUpdate(
            { email: resetData.email },
            { password: hashedPassword }
        );
        
        // Verwijder de gebruikte token
        passwordResetTokens.delete(token);
        
        res.json({ message: 'Wachtwoord succesvol gewijzigd' });
    } catch (error) {
        console.error('Wachtwoord reset error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});

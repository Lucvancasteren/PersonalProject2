require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const User = require('./models/User');

const app = express();

// Beveiligingsheaders
app.use(helmet());

// CORS configuratie
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://localhost:5001',
        'http://127.0.0.1:5001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: 100 // max 100 requests per IP
});
app.use('/api/', limiter);

app.use(express.json());

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
});

# Automotive Group Webapplicatie

## 🚗 Projectbeschrijving
Een moderne webapplicatie voor een autodealer met gebruikersauthenticatie, wachtwoordherstel en een uitgebreide auto-zoekfunctionaliteit. De applicatie is gebouwd met Node.js, Express en MongoDB voor de backend, en gebruikt Tailwind CSS voor de frontend styling.

## ⚙️ Technische Stack
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authenticatie**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer met Gmail SMTP

## 🛠️ Installatie

1. Clone de repository:
```bash
git clone https://github.com/your-repo/automotive-group-web-app.git
```

2. Installeer de afhankelijkheden:
```bash
npm install
```

3. Maak een `.env` bestand aan in de root directory met de volgende variabelen:
```env
MONGODB_URI=mongodb://localhost:27017/autodealer
JWT_SECRET=jouw_super_geheime_jwt_sleutel
FRONTEND_URL=http://127.0.0.1:5501
PORT=3000
EMAIL_USER=jouw_email@gmail.com
EMAIL_PASS=jouw_email_app_wachtwoord
```

4. Start de server:
```bash
npm start
```

5. Open de applicatie in je browser:
```bash
http://localhost:3000
```

## 🔑 Belangrijkste Functionaliteiten

### Gebruikersauthenticatie
- Registratie van nieuwe gebruikers
- Login met email en wachtwoord
- JWT-gebaseerde authenticatie
- Wachtwoordherstel via email

### Auto Zoekfunctie
- Zoeken op merk en model
- Uitgebreide filteropties
- Responsive grid-weergave van zoekresultaten

### Beveiliging
- Rate limiting voor API endpoints
- Helmet voor HTTP headers beveiliging
- CORS configuratie
- Wachtwoord hashing met bcrypt

## �� Projectstructuur

├── models/
│ └── User.js
├── public/
│ └── reset-password.html
├── server.js
├── package.json
├── .env
└── .gitignore

## 🔒 Beveiliging
- Alle wachtwoorden worden gehasht opgeslagen
- Rate limiting beschermt tegen brute force aanvallen
- Secure HTTP headers via Helmet
- CORS beveiliging geconfigureerd
- Beveiligde wachtwoordreset procedure

## 📧 Email Configuratie
Voor het gebruik van de wachtwoordherstel functionaliteit:
1. Stel een Gmail account in
2. Genereer een app-specifiek wachtwoord
3. Update de EMAIL_USER en EMAIL_PASS in het .env bestand

## 🤝 Bijdragen
Bijdragen zijn welkom! Voor grote wijzigingen, open eerst een issue om te bespreken wat je wilt veranderen.

## 📝 Licentie
Dit project is gelicentieerd onder de MIT
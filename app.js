const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

// Database setup
const db = new sqlite3.Database('./survey.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the survey database.');
});

db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    phone TEXT,
    nps INTEGER,
    overall INTEGER,
    food INTEGER,
    pricing INTEGER,
    service INTEGER,
    comment TEXT,
    discount_code TEXT,
    claimed BOOLEAN DEFAULT 0,
    claim_date DATE
)`);

db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/rate', (req, res) => {
    const { nps, email, mobile } = req.body;
    res.render('rate', { nps, email, mobile });
});

app.post('/submit-survey', (req, res) => {
    const { nps, email, mobile, overall, food, pricing, service, comment } = req.body;
    const discountCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    db.run(`INSERT INTO submissions (email, phone, nps, overall, food, pricing, service, comment, discount_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, mobile, nps, overall, food, pricing, service, comment, discountCode],
        (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Error saving survey');
            } else {
                res.render('thank-you', { code: discountCode });
            }
        });
});

// Admin routes
app.get('/admin/login', (req, res) => {
    res.render('admin-login');
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        } else if (!user) {
            res.status(401).send('Invalid credentials');
        } else {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    req.session.loggedIn = true;
                    res.redirect('/admin/dashboard');
                } else {
                    res.status(401).send('Invalid credentials');
                }
            });
        }
    });
});

app.get('/admin/dashboard', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/admin/login');
    }

    db.all('SELECT * FROM submissions ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        } else {
            res.render('admin-dashboard', { submissions: rows });
        }
    });
});

app.post('/admin/update-claim', (req, res) => {
    if (!req.session.loggedIn) {
        return res.status(401).send('Unauthorized');
    }

    const { id, claimed, claimDate } = req.body;
    db.run('UPDATE submissions SET claimed = ?, claim_date = ? WHERE id = ?',
        [claimed ? 1 : 0, claimDate || null, id],
        (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Error updating claim status');
            } else {
                res.sendStatus(200);
            }
        });
});

// Create an initial admin user (you should change this password!)
bcrypt.hash('admin123', 10, (err, hash) => {
    if (err) {
        console.error(err.message);
    } else {
        db.run('INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)', ['admin', hash]);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
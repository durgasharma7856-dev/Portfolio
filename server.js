const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const db = new sqlite3.Database('./portfolio.db');

db.serialize(() => {
    // 1. CREATE TABLES
    db.run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, media TEXT, tools TEXT, link TEXT, status TEXT DEFAULT 'completed')`);
    db.run(`CREATE TABLE IF NOT EXISTS certifications (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, organization TEXT, date TEXT, image TEXT, link TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, icon TEXT, description TEXT, level TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS soft_skills (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT UNIQUE, value TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY, text TEXT)`);

    // 2. INSERT DEFAULT TEXT CONTENT
    const textDefaults = [
        ['hero_title', 'Aspiring Data Analyst'],
        ['hero_desc', 'Transforming raw data into actionable insights. Specialized in SQL, Python, and Power BI to solve complex business problems.'],
        ['about_text', 'Currently pursuing my BCA at Sarala Birla University. I have a deep passion for data storytelling. I don\'t just look at numbers; I look for the stories they tell and the growth opportunities they hide.'],
        ['email', 'durgasharma7856@gmail.com'],
        ['phone', '+91 9060279491'],
        ['address', 'Ranchi, Jharkhand'],
        ['metric_1', '5+'],
        ['metric_2', '50k+'],
        ['metric_3', '3+']
    ];
    const stmtText = db.prepare('INSERT OR IGNORE INTO content (id, text) VALUES (?, ?)');
    textDefaults.forEach(d => stmtText.run(d));
    stmtText.finalize();

    // 3. INSERT DEFAULT PROJECTS (Completed)
    const projects = [
        ['Sales Dashboard', 'Analyzed 50k+ sales records to identify key revenue drivers. Created an interactive dashboard in Power BI reducing reporting time by 40%.', '[]', 'Power BI, SQL, Excel', 'https://github.com', 'completed'],
        ['Customer Churn Analysis', 'Predicted customer churn using Python (Pandas/Scikit-learn). Identified 3 major factors contributing to churn and proposed retention strategies.', '[]', 'Python, Machine Learning', 'https://github.com', 'completed'],
        ['E-commerce ETL Pipeline', 'Built an automated ETL pipeline to clean and transform daily sales data from raw CSVs into a SQL database for reporting.', '[]', 'SQL, Python, Airflow', 'https://github.com', 'completed'],
        ['Inventory Management System', 'Designed a database schema and front-end interface for tracking inventory levels in real-time for a local retail store.', '[]', 'SQL, Excel', 'https://github.com', 'completed']
    ];
    projects.forEach(p => db.run('INSERT INTO projects (title, description, media, tools, link, status) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM projects)', p));

    // 4. INSERT DEFAULT ONGOING PROJECTS
    const ongoing = [
        ['Stock Market Predictor', 'Developing a LSTM neural network to predict stock price trends based on historical data.', '[]', 'Python, Deep Learning', '', 'ongoing'],
        ['Healthcare Data Analysis', 'Cleaning and analyzing a large dataset of patient records to find correlations between lifestyle choices and health outcomes.', '[]', 'SQL, Tableau', '', 'ongoing']
    ];
    ongoing.forEach(p => db.run('INSERT INTO projects (title, description, media, tools, link, status) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM projects WHERE title = ?)', [...p, p[0]]));

    // 5. INSERT DEFAULT SKILLS
    const skills = [
        ['SQL', 'fas fa-database', 'Expert in complex queries, Joins, CTEs, and database optimization.', 'Advanced'],
        ['Power BI', 'fas fa-chart-bar', 'Creating interactive dashboards, DAX measures, and data modeling.', 'Intermediate'],
        ['Python', 'fab fa-python', 'Pandas, NumPy, and Matplotlib for data analysis and visualization.', 'Intermediate'],
        ['Excel', 'fas fa-file-excel', 'Advanced Pivot Tables, VLOOKUP, Macros, and VBA automation.', 'Advanced'],
        ['Tableau', 'fas fa-chart-pie', 'Building visual stories and geographical maps for business insights.', 'Beginner']
    ];
    skills.forEach(s => db.run('INSERT INTO skills (name, icon, description, level) SELECT ?, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM skills WHERE name = ?)', [...s, s[0]]));

    // 6. INSERT DEFAULT "WHY ME" TRAITS
    const traits = [
        ['Curious Problem Solver', 'I don\'t just see errors; I see puzzles waiting to be solved. I dig deep into data until I find the "Why".'],
        ['Business Aware', 'I understand that data is useless without context. I align technical analysis with actual business goals.'],
        ['Reliable & Organized', 'I document my process, write clean code, and ensure deliverables are accurate and on time.'],
        ['Continuous Learner', 'The tech world moves fast. I stay updated with the latest tools and methodologies in Data Science.']
    ];
    traits.forEach(t => db.run('INSERT INTO soft_skills (title, description) SELECT ?, ? WHERE NOT EXISTS(SELECT 1 FROM soft_skills)', t));

    // 7. INSERT DEFAULT SERVICES
    const services = [
        ['Dashboard Design', 'Turning messy excel sheets into clean, interactive dashboards (Power BI / Tableau) that stakeholders can understand at a glance.'],
        ['Data Cleaning', 'Transforming raw, messy, or missing data into a structured format ready for analysis and machine learning models.'],
        ['Ad-hoc Analysis', 'Quickly answering specific business questions by querying databases and providing actionable summaries.'],
        ['Automated Reporting', 'Setting up scripts (Python/SQL) to generate and email daily/weekly reports automatically, saving manual effort.']
    ];
    services.forEach(s => db.run('INSERT INTO services (title, description) SELECT ?, ? WHERE NOT EXISTS(SELECT 1 FROM services)', s));

    // 8. INSERT DEFAULT CERTIFICATIONS
    const certs = [
        ['Google Data Analytics', 'Coursera', 'Oct 2023', '', ''],
        ['SQL for Data Science', 'Udemy', 'Aug 2023', '', ''],
        ['Power BI Desktop Specialist', 'Microsoft', 'Dec 2023', '', '']
    ];
    certs.forEach(c => db.run('INSERT INTO certifications (name, organization, date, image, link) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM certifications)', c));
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// --- ROUTES (Keep exactly as before) ---
app.get('/api/projects', (req, res) => { db.all('SELECT * FROM projects ORDER BY id DESC', (err, rows) => res.json(rows.map(r => ({...r, media: JSON.parse(r.media || '[]')})))); });
app.post('/api/projects', upload.array('mediaFiles', 20), (req, res) => {
    if(req.body.password !== ADMIN_PASS) return res.status(401).send("No");
    const mediaPaths = req.files.map(f => '/uploads/' + f.filename);
    const existingMedia = req.body.existingMedia ? JSON.parse(req.body.existingMedia) : [];
    const finalMedia = JSON.stringify([...existingMedia, ...mediaPaths]);
    if(req.body.id) {
        db.run('UPDATE projects SET title=?, description=?, media=?, tools=?, link=?, status=? WHERE id=?', [req.body.title, req.body.description, finalMedia, req.body.tools, req.body.link, req.body.status, req.body.id], (err) => res.json({ok:1}));
    } else {
        db.run('INSERT INTO projects (title, description, media, tools, link, status) VALUES (?, ?, ?, ?, ?, ?)', [req.body.title, req.body.description, finalMedia, req.body.tools, req.body.link, req.body.status], (err) => res.json({ok:1}));
    }
});
app.post('/api/projects/delete', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('DELETE FROM projects WHERE id = ?', [req.body.id], () => res.json({ok:1})); });

// Add this to server.js
app.post('/api/login', (req, res) => {
    if(req.body.password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});


app.get('/api/certifications', (req, res) => db.all('SELECT * FROM certifications ORDER BY id DESC', (err, r) => res.json(r)));
app.post('/api/certifications', upload.single('certImage'), (req, res) => {
    if(req.body.password !== ADMIN_PASS) return res.status(401).send("No");
    const imgPath = req.file ? '/uploads/'+req.file.filename : req.body.existingImage;
    if(req.body.id) {
        db.run('UPDATE certifications SET name=?, organization=?, date=?, image=?, link=? WHERE id=?', [req.body.name, req.body.organization, req.body.date, imgPath, req.body.link, req.body.id], () => res.json({ok:1}));
    } else {
        db.run('INSERT INTO certifications (name, organization, date, image, link) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.organization, req.body.date, imgPath, req.body.link], () => res.json({ok:1}));
    }
});
app.post('/api/certifications/delete', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('DELETE FROM certifications WHERE id = ?', [req.body.id], () => res.json({ok:1})); });

app.get('/api/skills', (req, res) => db.all('SELECT * FROM skills', (err, r) => res.json(r)));
app.post('/api/skills', upload.single('skillIcon'), (req, res) => {
    if(req.body.password !== ADMIN_PASS) return res.status(401).send("No");
    const iconPath = req.file ? '/uploads/'+req.file.filename : req.body.existingIcon;
    if(req.body.id) {
        db.run('UPDATE skills SET name=?, icon=?, description=?, level=? WHERE id=?', [req.body.name, iconPath, req.body.description, req.body.level, req.body.id], () => res.json({ok:1}));
    } else {
        db.run('INSERT INTO skills (name, icon, description, level) VALUES (?, ?, ?, ?)', [req.body.name, iconPath, req.body.description, req.body.level], () => res.json({ok:1}));
    }
});
app.post('/api/skills/delete', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('DELETE FROM skills WHERE id = ?', [req.body.id], () => res.json({ok:1})); });

app.get('/api/soft_skills', (req, res) => db.all('SELECT * FROM soft_skills', (err, r) => res.json(r)));
app.post('/api/soft_skills', (req, res) => {
    if(req.body.password !== ADMIN_PASS) return res.status(401).send("No");
    if(req.body.id) {
        db.run('UPDATE soft_skills SET title=?, description=? WHERE id=?', [req.body.title, req.body.description, req.body.id], () => res.json({ok:1}));
    } else {
        db.run('INSERT INTO soft_skills (title, description) VALUES (?, ?)', [req.body.title, req.body.description], () => res.json({ok:1}));
    }
});
app.post('/api/soft_skills/delete', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('DELETE FROM soft_skills WHERE id = ?', [req.body.id], () => res.json({ok:1})); });

app.get('/api/services', (req, res) => db.all('SELECT * FROM services', (err, r) => res.json(r)));
app.post('/api/services', (req, res) => {
    if(req.body.password !== ADMIN_PASS) return res.status(401).send("No");
    if(req.body.id) {
        db.run('UPDATE services SET title=?, description=? WHERE id=?', [req.body.title, req.body.description, req.body.id], () => res.json({ok:1}));
    } else {
        db.run('INSERT INTO services (title, description) VALUES (?, ?)', [req.body.title, req.body.description], () => res.json({ok:1}));
    }
});
app.post('/api/services/delete', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('DELETE FROM services WHERE id = ?', [req.body.id], () => res.json({ok:1})); });

app.post('/api/contact', (req, res) => { const date = new Date().toLocaleString(); db.run('INSERT INTO messages (name, email, message, date) VALUES (?, ?, ?, ?)', [req.body.name, req.body.email, req.body.message, date], () => res.json({ok:1})); });
app.post('/api/messages', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.all('SELECT * FROM messages ORDER BY id DESC', (err, r) => res.json(r)); });
app.get('/api/settings', (req, res) => db.all('SELECT * FROM settings', (err, rows) => { let s={}; rows.forEach(r=>s[r.key]=r.value); res.json(s); }));
app.post('/api/settings/:key', upload.single('file'), (req, res) => { const val = req.file ? '/uploads/'+req.file.filename : req.body.value; db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [req.params.key, val], () => res.json({ok:1})); });
app.get('/api/content', (req, res) => db.all('SELECT * FROM content', (err, rows) => { let d={}; rows.forEach(r=>d[r.id]=r.text); res.json(d); }));
app.post('/api/content', (req, res) => { if(req.body.password !== ADMIN_PASS) return res.status(401).send("No"); db.run('INSERT OR REPLACE INTO content (id, text) VALUES (?, ?)', [req.body.id, req.body.text], () => res.json({ok:1})); });

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
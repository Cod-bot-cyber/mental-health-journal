const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: true
}));


const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Iphone11@64gb",  
  database: "mental_health"
});

db.connect(err => {
  if (err) console.log(" DB Error:", err);
  else console.log(" DB Connected");
});


app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "views", "index.html"));
});


app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views", "signup.html")));
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
    if (result.length > 0) return res.status(400).send("User already exists");
    db.query("INSERT INTO users (name,email,password) VALUES (?,?,?)", [name, email, password], (err2) => {
      if (err2) return res.status(500).send("DB Error");
      res.status(200).send("Signup successful");
    });
  });
});

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email=? AND password=?", [email, password], (err, result) => {
    if (err) return res.status(500).send("DB error");
    if (result.length === 0) return res.status(401).send("Invalid credentials");
    req.session.user = result[0];
    return res.json({ success: true });
  });
});


app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});


app.post("/add-entry", (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).send("Login first");
  const { mood, gratitude, stress_level } = req.body;
  db.query("INSERT INTO journal_entries (user_id, mood, gratitude, stress_level) VALUES (?,?,?,?)",
    [user.id, mood, gratitude, stress_level],
    err => {
      if (err) return res.status(500).send("DB error");
      res.send("Entry saved!");
    });
});


app.get("/entries", (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json([]);
  db.query("SELECT mood, gratitude, stress_level, entry_date FROM journal_entries WHERE user_id=? ORDER BY entry_date DESC LIMIT 7",
    [user.id],
    (err, results) => {
      if (err) return res.status(500).json([]);
      res.json(results);
    });
});


app.post("/feedback", (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).send("Login first");
  const { feedback_text, rating } = req.body;
  db.query("INSERT INTO feedbacks (user_id, feedback_text, rating) VALUES (?,?,?)",
    [user.id, feedback_text, rating],
    err => {
      if (err) return res.status(500).send("DB error");
      res.send("Thanks for your feedback!");
    });
});

app.listen(port, () => console.log(`Running on http://localhost:${port}`));
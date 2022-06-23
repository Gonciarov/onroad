const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./passportConfig");
const req = require('express/lib/request');

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", checkAuthenticated, (req, res) => {
    res.render("register");
});

app.get("/login", checkAuthenticated, (req, res) => {
    res.render("login");
});

app.get("/dashboard", checkNotAuthenticated, (req, res) => {
    let email = req.user.email;
    pool.query(
        `SELECT * FROM requests WHERE email = ($1)`, [email],
        (err, results) => {
            if (err) {
                throw err;
            } 
            let keywords = results.rows[0]["keywords"];
            console.log(keywords)
            res.render("dashboard", { name: req.user.name, email: email, keywords: keywords });   
        }
    )
    
});

app.get("/logout", (req, res) => {
    req.logOut();
    req.flash('success_msg', "You have logged out");
    res.redirect('/login');
});

app.get("/jobs-found", checkNotAuthenticated, (req, res) =>{
    res.redirect('/dashboard')
})

app.post("/jobs-found", checkNotAuthenticated, (req, res) => {
    let name = req.user.name;
    let email = req.user.email;
    let { industry, location } = req.body
    Promise.all([
    pool.query("SELECT * FROM users WHERE email = ($1)", [email]),
    pool.query("SELECT * FROM requests WHERE email = ($1)", [email])
]).then(function([profile, requests]) {
    requests = requests.rows[0];
    if (requests["keywords"] === null) {
        requests["keywords"] = {};
    } 
    let counter1 = parseInt(requests["keywords"][industry]) || 0;
    counter1 +=1;
    requests["keywords"][industry] = counter1

    let counter2 = parseInt(requests["keywords"][location]) || 0;
    counter2 +=1;
    requests["keywords"][location] = counter2
    pool.query(`UPDATE requests SET keywords = '${JSON.stringify(requests["keywords"])}' WHERE email = '${email}'`)
    res.render('dashboard', { name: name, email: email, keywords: requests["keywords"]})
})
})



app.post("/register", async(req, res) => {
    let { name, email, password, password2 } = req.body;
    console.log({ name, email, password, password2 });

    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters" });
    }

    if (password != password2) {
        errors.push({ message: "Passwords should match" });
    }

    if (errors.length > 0) {
        res.render('register', { errors });

    } else {

        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
                if (err) {
                    console.log(err);
                }

                if (results.rows.length > 0) {
                    errors.push({ message: "Email already registered" });
                    res.render("register", { errors });
                } else {
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, password`, [name, email, password],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }    
                        }
                    )
                    pool.query(
                        `INSERT INTO requests (email) VALUES ($1)`, [email]
                    )
                        
                            req.flash("success_msg", "You are now registered please log in")
                            res.redirect('/login')
                }
            }
        )
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
}));

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
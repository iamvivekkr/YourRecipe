require(`dotenv`).config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

const Register = require("./models/registers");
require("./db/conn");

const port = process.env.PORT || 3000;

//find index file
const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partial_path = path.join(__dirname, "../templates/partials");//find partials to add nav bar

//after fill form and submit to save data
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));

//find views file
app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partial_path);


app.get("/", (req, res) => {
    res.render("index");
});



app.get("/logout", auth, async (req, res) => {
    try {
        //logout from particular device
        req.user.tokens = req.user.tokens.filter((currElement) => {
            return currElement.token !== req.token
        })
        res.clearCookie("jwt");//logout from particular dev

        //req.use.tokens = []      logout form all dev
        
        await req.user.save();
        res.render("login");
    } catch (error) {
        res.status(500).send(error);
    }
});


//to show register.hbs page
app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/recipe", auth, (req, res) => {
    res.render("recipe");
});

//to show login.hbs page
app.get("/login", (req, res) => {
    res.render("login");
});



//create new user in our database
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if(password===cpassword){
            const registerUser = new Register({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                password : password,
                confirmpassword : cpassword
            })

            //password hash call here by pre meyhod code in register,hbs
            //jws token
            const token = await registerUser.generateAuthToken();

            res.cookie("jwt", token, {
                expires:new Date(Date.now() + 30000),
                httpOnly:true
           });

            const register = await registerUser.save();
            res.status(201).render("login");//registration k bad login p jyega
        }else{
            res.render("register"); //if error comes
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

//to check login and open require page
app.post("/login", async(req, res) => {
    try {
        const email = req.body.email;  //jo v form k under name attribute m hoga usko paste kr dena
        const password = req.body.password;

        //collection name Register
       const useremail = await Register.findOne({email:email});
       
       const isMatch = await bcrypt.compare(password, useremail.password);

       //generate token
       const token = await useremail.generateAuthToken();

       //cookie
       res.cookie("jwt", token, {
            expires:new Date(Date.now() + 600000),
            httpOnly:true
            //secure:true
       });

       if(isMatch){
        res.status(201).render("recipe");
       }else{
        res.render("login");//if error comes
        
       }

    } catch (error) {
        res.status(400).send(error);
    }

});





app.listen(port, () => {
    console.log(`server is running at port no ${port}`);
})


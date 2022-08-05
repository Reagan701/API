
require('dotenv').config()

const bodyParser = require('body-parser');
const express = require('express');
const database = require('./config/dbcon');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const secret = process.env.secretKey;
const auth = require('./auth');
const port = process.env.PORT || 3000

const router = express.Router();

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})

app.use(router, express.json(), express.urlencoded({
    extended: true
}))

app.listen(port);

router.get('/', (req,res) =>{
    res.sendFile('./views/index.html', {root: __dirname});
})

router.get('/products', (req,res)=>{
    res.sendFile('./views/allProducts.html', {root: __dirname})
})

router.get('/allProducts', bodyParser.json(), async (req,res) =>{
    const query = `SELECT * FROM products`;
    database.query(query, (err,result) =>{
        if(err) throw err;
        console.log(result);
        res.json({
            results: result
        })
    })
})

router.post('/registerUser', bodyParser.json(), async (req,res) =>{

    const check = `SELECT email FROM users WHERE ?`

    let email = {
        email: req.body.email
    }

    database.query(check, email, async (err,results) =>{
        if(err) throw err;
        if(results.length >0){
            res.json({
                result: "Already a user"
            });
        }else{
            req.body.userpassword = await bcrypt.hash(req.body.userpassword,10);

            const query = `INSERT INTO users(firstname, lastname, gender, address, email, userpassword)
            VALUES(?,?,?,?,?,?)`

            database.query(query, [req.body.firstname, req.body.lastname, req.body.gender, req.body.address, req.body.email, req.body.userpassword], (err,results) =>{
            if(err) throw err;
            res.json({
                result: results.affectedRows
            })
        })
        }
    })
})

router.get('/singleProduct', (req,res) =>{
    res.sendFile('./views/singleProduct.html', {root: __dirname})
})

router.get('/login', (req,res) =>{
    res.sendFile('./views/loginPage.html', {root: __dirname});
})
router.get('/register', (req,res) =>{
    res.sendFile('./views/registerPage.html', {root: __dirname});
})

router.post('/loginUser', bodyParser.json(), (req,res) =>{
    const query = `SELECT * FROM users WHERE email = ?`;
    database.query(query, [req.body.email], (err,result)=>{
        if(result.length >0){
            bcrypt.compare(req.body.userpassword, result[0].userpassword, (err,info) =>{
                if(info){
                    const payload = {
                        user: {
                            id: result[0].id,
                            firstname: result[0].firstname 
                        }
                    }
                    jwt.sign(payload, process.env.secretKey, {
                        expiresIn: '365d'
                    }, 
                    (err, token) => {
                        if(err) throw err
                        res.json({token})
                    })
                }else{
                    res.json({
                        results: "Password is incorrect"
                    })
                }
            })
        }else{
            res.json({
                results: "There is no user with that email"
            })
        }
    })
})

router.get('/users', (req,res)=>{
    const query = `SELECT * FROM users`;
    database.query(query, (err,result) =>{
        if(err) throw err;
        res.json({
            results:result
        })
    })
})


router.get('/verify', (req,res) =>{
    const token = req.header("x-auth-token");

    if(!token){
        return res.status(400), res.send("400")
    }

    jwt.verify(token, process.env.secretKey, (err, decodedToken) => {

        if (err) throw err
        res.json({decodedToken})
    });
})
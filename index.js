const express = require('express')
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const bcryptSalt = bcrypt.genSaltSync(12)
mongoose.connect(process.env.MONGO_STRING)
const mailer = require('nodemailer')
const User = require('./models/User')
const EmailConfirmation = require('./models/EmailConfirmation')
const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET
const cookieParser = require('cookie-parser')
const Post = require('./models/Post')
//const multer = require('multer')
const cloudinary = require('cloudinary')
const {uploadMediaToCloudinary, deleteMediaFromCloudinary} = require('./helpers/cloudinary')
const mediaRoutes = require('./routes/media-routes')






const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.REACT_URL,
}))



//email middleware



const transporter = mailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GAU,
        pass: process.env.GAP
    }
})

async function sendEmail(emailAddress, vcode){
    let message = "<h1>Confirm Your Email Address</h1>"
    message += "<p>Newman needs you to confirm your email address to use your new account. Enter the validation code in the app. Do not share this code with anyone else. This code is valid for only 10 minutes.</p>"
    message += "<br><br>"
    message += "<h2>" + vcode + "</h2>"
    message += "<br><br>"
    message += "<p>If you did not attempt to create an account in the Newman app, please contact Ryan Sotelo at rsotelo@newmancchs.org.</p>"
    const mailOptions = {
        form: process.env.GAU,
        to: emailAddress,
        subject: "Confirm Your Email Address | Newman App",
        html: message
    }

    transporter.sendMail(mailOptions, (error, info)=>{
        if(error){
            console.log('Error', error)
            return {success: false, error: error}
        }
        else{
            console.log("Email sent: ", info.response)
            return {success: true, info:info.response}
        }
    })
}





//routes
app.use('/media', mediaRoutes)

app.get('/', (req,res)=>{
    res.json('test ok')
})

app.post('/register', async (req,res)=>{
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        accountType
    } = req.body
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
    const userDetails = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        accountType
    }
    try {
        const userDoc = await User.create(userDetails)
        const newDoc = {
            firstName:userDoc.firstName, 
            lastName:userDoc.lastName, 
            email: userDoc.email,
            active: userDoc.active,
            _id: userDoc._id,
            accountType: userDoc.accountType,
            schools: userDoc.schools
        }
        console.log(userDoc)
        let vcode = ""
        for(let i=0; i < 4; i++){
            vcode += Math.floor(Math.random()*10).toString()
        }
        sendEmail(email, vcode)
        const ConfirmationDoc = await EmailConfirmation.create({
            userId: userDoc._id,
            email,
            code: vcode,
            date: Date.now()+10*60000
        })
        res.status(201).json({success: true, userDoc:newDoc})
    } catch (error) {
        if(error) console.log(error)
        res.status(500).json({success: false})
    }
})

app.post('/login', async (req,res)=>{
    const {
        email,
        password
    } = req.body
    try {
        const userDoc = await User.findOne({email})
        const newDoc = {
            firstName:userDoc.firstName, 
            lastName:userDoc.lastName, 
            email: userDoc.email,
            active: userDoc.active,
            _id: userDoc._id,
            accountType: userDoc.accountType,
            schools: userDoc.schools
        }
        if(userDoc){
            const passOk = bcrypt.compareSync(password, userDoc.password)
            if(passOk){
                if(userDoc.active){
                    jwt.sign(newDoc, jwtSecret, {}, (err, token)=>{
                        if(err) {
                            console.log('cookie crumbles')
                            throw err
                        }
                        res.status(200).cookie('token', token).json({success: true, userDoc:newDoc, active: true})
                    })
                }
                else{
                    res.status(200).json({success: true, userDoc:newDoc, active: false})
                }
            }
            else{
                console.log('password incorrect')
                res.status(400).json({success: false, userDoc:newDoc, message:'password incorrect'})
            }
        }
        else{
            console.log('user not found')
            res.status(400).json({success: false, message:'user not found'})
        }
    } catch (error) {
        console.log('shit happens')
        res.status(500).json({success: false, message:'shit happens'})
    }
})


app.post('/confirmEmail', async (req,res)=>{
    const {
        userId,
        email,
        code
    } = req.body
    try {
        const confirmationDoc = await EmailConfirmation.findOne({email})
        if(confirmationDoc.date >= Date.now()){
            if(code === confirmationDoc.code){
                try {
                    const userDoc = await User.findOneAndUpdate({email},{
                        active: true,
                        emailConfirmed: true
                    })
                    const newDoc = {
                        firstName:userDoc.firstName, 
                        lastName:userDoc.lastName, 
                        email: userDoc.email,
                        active: userDoc.active,
                        _id: userDoc._id,
                        accountType: userDoc.accountType,
                        schools: userDoc.schools
                    }
                    await EmailConfirmation.deleteMany({email})
                    jwt.sign(newDoc, jwtSecret, {}, (err, token)=>{
                        if(err) throw err
                        res.status(200).cookie('token', token).json({success: true, userDoc:newDoc})
                    })
                } catch (error) {
                    res.status(500).json({success: false})
                }
            }
            else{
                res.status(400).json({success: false, message:'bad code'})
            }
        }
        else{
            res.status(400).json({success: false, message:'timed out'})
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, error})
    }
})


app.post('/resendConfirmEmail', async (req,res)=>{
    const {email, userId} = req.body
    try {
        const userDoc = await User.findOne({email})
        const newDoc = {
            firstName:userDoc.firstName, 
            lastName:userDoc.lastName, 
            email: userDoc.email,
            active: userDoc.active,
            _id: userDoc._id,
            accountType: userDoc.accountType,
            schools: userDoc.schools
        }
        await EmailConfirmation.deleteMany({email})
        let vcode = ""
        for(let i=0; i < 4; i++){
            vcode += Math.floor(Math.random()*10).toString()
        }
        const confirmationDoc = await EmailConfirmation.create({
            userId,
            email,
            code: vcode,
            date: Date.now()+10*60000
        })
        sendEmail(email, vcode)
        res.status(201).json({success: true, userDoc:newDoc})
    } catch (error) {
        if(error) console.log(error)
        res.status(500).json({success: false})
    }
})

app.get('/account',async(req,res)=>{
    const {token} = req.cookies
    if(token){
        jwt.verify(token, jwtSecret, {}, async (err, cookieData)=>{
            if(err) throw err
            console.log(cookieData)
            const userDoc = await User.findById(cookieData._id)
            const newDoc = {
                firstName:userDoc.firstName, 
                lastName:userDoc.lastName, 
                email: userDoc.email,
                active: userDoc.active,
                _id: userDoc._id,
                accountType: userDoc.accountType,
                schools: userDoc.schools
            }
            res.json({userDoc:newDoc})
        })
    }
    const {_id, emaial, accountType, active, firstName, lastName} = req.body.userDoc
    const userDoc = await User.findById(_id)
    const newDoc = {
        firstName:userDoc.firstName, 
        lastName:userDoc.lastName, 
        email: userDoc.email,
        active: userDoc.active,
        _id: userDoc._id,
        accountType: userDoc.accountType,
        schools: userDoc.schools
    }
    res.status(200).json({userDoc:newDoc})
})

app.get('/getUser', async(req,res)=>{
    try {
        const {token} = req.cookies
        console.log(token)
        if(token){
            jwt.verify(token, jwtSecret, {}, async (err, cookieData)=>{
                if(err) throw err
                console.log(cookieData)
                const userDoc = await User.findById(cookieData._id)
                const newDoc = {
                    firstName:userDoc.firstName, 
                    lastName:userDoc.lastName, 
                    email: userDoc.email,
                    active: userDoc.active,
                    _id: userDoc._id,
                    accountType: userDoc.accountType,
                    schools: userDoc.schools
                }
                res.json({userDoc:newDoc})
            })
        }
        else{
            res.json({userDoc:null})
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({userDoc:null})
    }
})

app.post('/logout', (req,res) => {
    res.cookie('token', '').json(true);
})


app.get('/posts', async (req,res)=>{
    try {
        // const {token} = req.cookies
        // console.log(token)
        // if(token){
        //     jwt.verify(token, jwtSecret, {}, async (err, cookieData)=>{
        //         if(err) throw err
        //         const userDetails = {
        //             firstName:cookieData.firstName, 
        //             lastName:cookieData.lastName, 
        //             email: cookieData.email,
        //             active: cookieData.active,
        //             _id: cookieData._id,
        //             accountType: cookieData.accountType,
        //             schools: cookieData.schools
        //         }
        //         const posts = await Post.find({})
        //         console.log(posts)
        //         res.status(200).json(posts)
        //     })
        // }
        // else{
        //     console.log('no token')
        //     res.json(null)
        // }
        const posts = await Post.find({})
        console.log(posts)
        res.status(200).json(posts)
    } catch (error) {
        console.log(error)
        res.status(400).json(null)
    }
})

app.post('/upload-from-link',async(req,res)=>{
    const {path} = req.body
    const result = await uploadMediaToCloudinary(path)
    console.log(result)
    res.json(result)
})


app.post('/post', async (req,res)=>{
    const {
        authorId,
        title,
        body,
        photos,
        photoPosition
    } = req.body
    try {
        const result = await Post.create({authorId,title,body,photos,photoPosition})
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.json({success: false, error})
    }
})

app.get('/post/:id', async (req,res)=>{
    const {id} = req.params
    try {
        const result = await Post.findById(id)
        if(result) res.status(201).json(result)
        res.status(404).json('Post not found')
    } catch (error) {
        console.log(error)
        res.status(500).json({success: false,error})
    }
})





app.listen(4000)
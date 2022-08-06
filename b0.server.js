/* #region. 1.Parámetros y recursos generales*/

/* #region. Plantilla*/

/* #endregion */ 

const express=require('express');
const http=require('http');
const apiRouter=require('./b1.routes/apiRouter');
const { Server }=require("socket.io");

const MongoStore=require('connect-mongo')
const session=require('express-session')

//const session=require('express-session')
const passport=require('passport')
const LocalStrategy=require('passport-local').Strategy
const mongoose=require('mongoose')

const routes=require('./b1.routes/routes')
const Users=require('./b3.models/models')

const app=express();
const server=http.createServer(app)
const io=new Server(server);
const PORT=8081;
/* #endregion */

/* #region. 2.Recursos de web socket*/
const mensajesDBTest=[
    {id:1,nombre:"User 1",correo:"u1@company.com",edad:20,textoIngresado:"Iniciamos!"},
    {id:2,nombre:"User 2",correo:"u2@company.com",edad:21,textoIngresado:"Primero!"},
    {id:3,nombre:"User 3",correo:"u3@company.com",edad:22,textoIngresado:"Que empiece!"}
]

let messages=[]

let GetComentarios=()=>{
    const options = {
        host : 'localhost',
        port : 8081,
        path: '/api/comentarios/file',
        method: 'GET'
    };
    // Sending the request
    const req = http.request(options, (res) => {
    let data = ''
    res.on('data', (chunk) => {
        data += chunk;
    });
    // Ending the response 
    res.on('end', () => {
        messages = JSON.parse(data);
        console.log("mensajes",data)
        console.log('mensajesJson:', JSON.parse(data))
    });
       
    }).on("error", (err) => {
    console.log("Error: ", err)
    }).end()
            
} 

io.on('connection',(socket)=>{
    GetComentarios()
    socket.emit('messages',messages)
    console.log('User conectado Get, id:'+socket.id);
    let mensajesDBTemporal=messages
    console.log('Usuario conectado socket inicial')
    socket.on('new-message',data=>{
        GetComentarios()
        console.log("Recibido new-message")
        dataJson=JSON.parse(data)
        console.log("DataSinId: ", dataJson)
        dataJson["id"]="1";
        console.log("DataConId: ", dataJson)
        mensajesDBTemporal.push(dataJson)
        //messagesTemp.push(data)
        io.sockets.emit('messages',mensajesDBTemporal);
        console.log('mensajesDBTemporal.new-message-fin.socketOn.inOn.Server',mensajesDBTemporal)
    });
    socket.on('new-message-delete',data=>{
        GetComentarios()
        mensajesDBTemporal=[]
        //messagesTemp.push(data)
        io.sockets.emit('messages',mensajesDBTemporal);
        console.log('mensajesDBTemporal.new-message-delete-fin.socketOn.inOn.Server',mensajesDBTemporal)
    });
    
})
/* #endregion */ 

/* #region. 3.Uso de objetos de librería express*/

//3.1.Uso de objetos en otros JS
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(express.static(__dirname+'/public'))
/*
app.use(session({
    store:new MongoStore({
        mongoUrl: 'mongodb://localhost:27017/sessions'
    }),
    secret:'conrat',
    resave:false,
    saveUninitialized:false
}))
*/
app.use('/api',apiRouter);

app.set('views','./f1.views')
app.set('view engine','ejs')

//3.3.Envío de datos a URLs
/*
app.get('/login',(req,res)=>{
    if(req.session.username) return res.redirect('/home')
    res.sendFile('login.html',{root: __dirname+'/public'})
})

app.post('/login',(req,res)=>{
    req.session.username=req.body.username
    return res.redirect('/home')
})

app.get('/home',(req,res)=>{
    console.log(req.session);
    let username=req.session.username
    console.log("reqSessionUsername.appGet",username)
    if(!username) return res.redirect('/login')
    return res.render('home',{username})
})

app.get('/logout',(req,res)=>{
    let username=req.session.username
    req.session.destroy()
    return res.render('logout',{username})

})

app.get('/chat',(req,res)=>{
    console.log(req.session);
    let username=req.session.username
    console.log("reqSessionUsername.appGet",username)
    return res.render('chat.ejs',{username})
})

app.get('/productos',(req,res)=>{
    console.log(req.session);
    let username=req.session.username
    console.log("reqSessionUsername.appGet",username)
    return res.render('productos.ejs',{username})
})
*/
/* #endregion */ 

/* #region. 4.Passport*/
passport.use('login',new LocalStrategy(
    (username,password,done)=>{
        Users.findOne({username},(err,user)=>{
            if(err) return done(err)
            if(!user){console.log('User not found')}

            return done(null,user)
        })
    }
))

passport.use('signup',new LocalStrategy(
    {passReqToCallback: true},
    (req,username,password,done)=>{
        console.log('signup...')
        
        Users.findOne({username},(err,user)=>{
            if(err) return done(err)
            if(user){
                console.log('User already exists')
                return done(null,user)
            }

            const newUser={username,password,name:req.body.name}
            Users.create(newUser,(err,userWithID)=>{
                if(err) return done(err)

                console.log(userWithID)
                return done(null,userWithID)
            })
            
        })
        
    }
))

passport.serializeUser((user,done)=>{
    done(null,user._id)
})

passport.deserializeUser((id,done)=>{
    Users.findById(id,done)
})

app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:false,
    rolling:true,
    cookie:{
        maxAge:60000,
        secure:false,
        httpOnly:true
    }
}))

app.use(passport.initialize())
app.use(passport.session())

//Define routes
app.get('/',routes.getRoot)
app.get('/login',routes.getLogin)

app.post(
    '/login',
    passport.authenticate('login'),
    routes.postLogin
    
)
app.get('/signup',routes.getSignup)
app.post(
    '/signup',
    passport.authenticate('signup',{failureRedirect: '/failsignup'}),
    routes.postSignup
)

app.get('/failsignup',routes.getFailSignup)

function checkAuthentication(req,res,next){
    if(req.isAuthenticated()) next()
    else res.redirect('/login')
}
app.get('/private',checkAuthentication,(req,res)=>{
    const {user}=req
    res.send('<h1>Solo pudiste entrar porque está logueado</h1>')
})

app.get('/home',checkAuthentication,(req,res)=>{
    console.log(req.session);
    let username=req.user.username
    console.log("username.get.home.b0ServerJS",username)
    if(!username) return res.redirect('/login')
    return res.render('home',{username})
})

app.get('/logout',checkAuthentication,(req,res)=>{
    let username=req.user.username
    req.session.destroy()
    return res.render('logout',{username})

})

app.get('/chat',checkAuthentication,(req,res)=>{
    console.log(req.session);
    let username=req.user.username
    console.log("username.get.chat.b0ServerJS",username)
    return res.render('chat.ejs',{username})
})

app.get('/productos',checkAuthentication,(req,res)=>{
    console.log(req.session);
    let username=req.session.username
    console.log("reqSessionUsername.appGet",username)
    return res.render('productos.ejs',{username})
})

function connectDB(url,cb){
    mongoose.connect(
        url,
        {
            useNewUrlParser:true,
            useUnifiedTopology:true

        },
        err=>{
            if(!err) console.log('Connected DB para passport')
            if(cb!=null) cb(err)
        }
    )
}

connectDB('mongodb://localhost:27017/dbCoderTest',err=>{
    if(err) return console.log('Error connecting DB',err)   
})
/* #endregion */ 

/* #region. 5.Iniciando servidor general*/
server.listen(PORT,()=>{
    console.log('Listening on port: '+PORT);
})
/* #endregion */ 

/*
app.post('/login',passport.authenticate('login'),(req,res)=>{
    console.log("req.user.postLogin.b0ServerJS",req.user)
    let username=req.session.username
    res.render('home',{username})
})
*/

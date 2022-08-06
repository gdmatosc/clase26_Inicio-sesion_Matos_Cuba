const res=require('express/lib/response')
const path = require('path')

function getRoot(req,res){
    res.sendFile(path.resolve(__dirname, '../public')+'/index.html')
}

function getLogin(req,res){
    if(req.isAuthenticated()){
        const user=req.user
        let username=req.user.username
        //res.send('login-ok')
        res.render('home',{username})
    }else{
        
        res.sendFile(path.resolve(__dirname, '../public')+'/login.html')
    }
}

function postLogin(req,res){
    console.log("req.user.postLogin.RoutesJS",req.user)
    console.log("req.session.postLogin.RoutesJS",req.session)
    console.log("req.session.username.postLogin.RoutesJS",req.user.username);
    let username=req.user.username
    res.render('home',{username})
}

function getSignup(req,res){
    res.sendFile(path.resolve(__dirname, '../public')+'/signup.html')
}

function getFailSignup(req,res){
    res.send('Fail signup')
}

function postSignup(req,res){
    console.log("req.user.postSignup.RoutesJS",req.user)
    let username=req.user.username
    res.render('home',{username})

}

module.exports={
    getRoot,
    getLogin,
    postLogin,
    getSignup,
    getFailSignup,
    postSignup
}
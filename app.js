
var express = require('express');

var router = require('./router/router.js')

var session = require('express-session');

var app = express();

app.use(express.static('./public'));

app.use('/avator',express.static('./avator'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.set('view engine','ejs');

app.get('/',router.showIndex);

app.get('/register',router.register);

app.post('/doRegister',router.doRegister);

app.get('/login',router.login);

app.post('/doLogin',router.doLogin);

app.get('/setavator',router.setavator);

app.post('/dosetavator',router.dosetavator);

app.get('/cut',router.showcut);

app.get('/docut',router.cut);


app.post('/post',router.post);

app.get('/getallpost',router.getallpost);

app.get('/getinfo',router.getinfo);

app.get('/allNum',router.allNum);

app.get('/user/:userName',router.showUser);

app.get('/getallusers',router.getallusers);

// app.get('/post/:oid',router.getpost);



app.listen(3000);
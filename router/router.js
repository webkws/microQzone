var formidable = require('formidable');

var db = require('../models/db.js');

var md5 = require('../models/md5.js');

var path = require('path');

var fs = require('fs');

var gm = require('gm');

exports.showIndex = function(req, res, next) {

    //检索数据库，查找此人的头像
    if (req.session.login == '1') {

        var userName = req.session.userName;

        var login = true;

    } else {

        var userName = '',

            login = false;

    }
    db.find('users', {

        'userName': userName

    }, function(err, r) {

        if (r.length == 0) {

            var avator = 'default.jpg';

        } else {

            var avator = r[0].avator;
        }
        res.render('index', {

            'login': login,

            'userName': userName,

            'active': 'index',

            'avator': avator

        });

    })


}

exports.register = function(req, res, next) {

    res.render('register', {

        'login': req.session.login == '1' ? true : false,

        'userName': req.session.login == '1' ? req.session.userName : "",

        'active': 'register'
    });

}
exports.login = function(req, res, next) {

    res.render('login', {

        'login': req.session.login == '1' ? true : false,

        'userName': req.session.login == '1' ? req.session.userName : "",

        'active': 'login'
    });

}

exports.doLogin = function(req, res, next) {

    //查询用户有没有这个人，如果有 查看密码用户名是否匹配

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {

        var userName = fields.userName;

        var pwd = fields.pwd;

        db.find('users', {
            'userName': userName
        }, function(err, r) {

            if (err) {

                res.send(-5);

                return;

            }

            if (r.length == 0) {

                res.send('-1');

                return;

            }
            var keyPwd = md5(pwd) + md5(pwd) + 'KWS';

            if (r[0].pwd == keyPwd) {

                req.session.login = "1";

                req.session.userName = userName;

                res.send('1');

            } else {

                res.send('-2');

                return;

            }

        })

    });


}

exports.doRegister = function(req, res, next) {

    // 查询数据库中是否有这个人，如果没有就保存，如果有旧返回-1 提示用户 用户名已经存在

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {

        var userName = fields.userName;

        var pwd = fields.pwd;

        db.find('users', {

            'userName': userName

        }, function(err, r) {

            if (err) {

                res.send(-3); //服务器错误

            } else if (r.length != 0) {

                res.send('-1'); //被占用

                return;

            }

            pwd = md5(pwd) + md5(pwd) + 'KWS';

            db.insertOne('users', {
                'userName': userName,
                'pwd': pwd,
                'avator': 'default.jpg'
            }, function(err, r) {

                if (err) {

                    res.send('-3');

                    return;
                }


                req.session.login = '1';

                req.session.userName = userName;

                res.send('1');
            })

        })

    });


}
exports.setavator = function(req, res, next) {

    if (req.session.login !== '1') {

        res.end('非法');

        return;
    }
    res.render('setavator', {

        'login': true,

        'userName': req.session.userName || "小花",

        'active': 'setavator'

    })

}
exports.dosetavator = function(req, res, next) {

    if (req.session.login !== '1') {

        res.end('非法');

        return;
    }

    var form = new formidable.IncomingForm();

    form.uploadDir = path.normalize(__dirname + '/../avator');

    form.parse(req, function(err, fields, files) {

        var oldPath = path.normalize(files.upload.path);

        var extname = path.extname(files.upload.name);

        var newPath = path.normalize(__dirname + '/../avator/' + '/' + req.session.userName + extname)

        fs.rename(oldPath, newPath, function(err) {

            if (err) {

                res.send('失败');

                return;
            }



        });
        req.session.avator = req.session.userName + extname;

        res.redirect('/cut');

    });
}

exports.showcut = function(req, res, next) {


    if (req.session.login !== '1') {

        res.end('非法');

        return;
    }

    res.render('cut', {

        'avator': req.session.avator
    });

}
exports.cut = function(req, res, next) {

    if (req.session.login !== '1') {

        res.end('非法');

        return;

    }

    var filename = req.session.avator;

    var w = req.query.w;

    var h = req.query.h;

    var x = req.query.x;

    var y = req.query.y;

    gm('./avator/' + filename)

    .crop(w, h, x, y)

    .resize(100, 100, '!')

    .write('./avator/' + filename, function(err) {

        if (err) {

            res.send('-1');

            return;

        } else {

            db.updateMany('users', {
                    'userName': req.session.userName
                },

                {
                    $set: {
                        'avator': req.session.avator
                    }
                }

                ,
                function(err, result) {

                    res.send('1');
                })

        }

    });
}


exports.post=function(req, res, next){

    if (req.session.login !== '1') {

        res.end('非法');

        return;
    }
    var userName = req.session.userName;



    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {

        var content = fields.content;

        db.insertOne('posts', {

            'userName': userName,

            'dateTime':new Date(),

            'content': content
        }, function(err, r) {

            if (err) {

                res.send('-3');

                return;
            }

            res.send('1');
        })

    });

}

exports.getallpost = function(req, res, next){

    var pageNum  = req.query.pageNum;

    db.find("posts",{},{"pageamount":20,"page":pageNum,"sort":{"datetime":-1}},function(err,result){

       
        res.json(result);
    });

}

exports.getinfo = function(req, res, next){

    var userName = req.query.userName;

    db.find('users',{'userName':userName},function(err, result){

        if(err || result.length ==0){

            res.json('');

            return;
        }
        var obj = {
            'userName':result[0].userName,
            'avator':result[0].avator,
            '_id':result[0]._id
        }
        res.json(obj);
    })

}
exports.allNum=function(req, res, next){
    db.getAllCount("posts",function(count){
        res.send(count.toString());
    });
}
exports.showUser=function(req, res, next){
    
   var userName = req.params['userName'];

   db.find('posts',{'userName':userName},function(err,r1){

   db.find('users',{'userName':userName},function(err,r2){
            res.render('user',{
                'login':req.session.login =='1'?true:false,
                'userName':req.session.login=='1'?req.session.userName:"",
                'userName':userName,
                'active':'myPost',
                'userAllS':r1,
                'userAvator':r2[0].avator

            })
   })       
   })
}

exports.getallusers=function(req, res, next){


   db.find('users',{},function(err,r){
    
    res.render('userlist',{
        'login':req.session.login =='1'?true:false,
        'userName':req.session.login=='1'?req.session.userName:"",
        'allUsers':r,
        'active':'allusers'
    })
       
   })
}
const mongoose = require('mongoose')
const {DBHOST,DBPORT,DBNAME,USERNAME,PASSWORD} = require('./config')
const db = require('./db')
const https = require('https');
const fs = require('fs');
const path = require('path');
const SSLpath = require('path');
const session = require('express-session')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')
const express = require("express");
const app = express();
const loginRoutes = require('./routes/loginRoutes');
const articleRoutes = require('./routes/articleRoutes');
const bodyParser = require('body-parser');
// 读取 SSL/TLS 证书和密钥
const options = {
    key: fs.readFileSync(path.join(__dirname, '/crk/ugcc.fun.key')),
    cert: fs.readFileSync(path.join(__dirname, '/crk/ugcc.fun_bundle.crt'))
};
mongoose.set('strictQuery',true)
// CORS 中间件配置
const cors = require('cors');
const UserModel = require("./models/UserModel");
const {log} = require("debug");
const {schedule} = require("node-cron");
app.use(bodyParser.json({ limit: '300mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '300mb' }));
// app.use(cors({
//     origin: 'http://localhost:5173',
//     optionsSuccessStatus: 200, // 一些旧版浏览器 (IE11, various SmartTVs) 对 204 响应不兼容
//     credentials: true // 允许跨域携带cookie
// }));
// CORS handling middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    next();
});
//session中间件
app.use(session({
    name: 'sid',   //设置cookie的name，默认值是：connect.sid
    secret: 'UGCC-nieheihei-2020-08-17-copyright', //参与加密的字符串（又称签名）  加盐
    saveUninitialized: false, //是否为每次请求都设置一个cookie用来存储session的id
    resave: true,  //是否在每次请求时重新保存session
    store: MongoStore.create({
        mongoUrl: `mongodb://${USERNAME}:${PASSWORD}@${DBHOST}:${DBPORT}/${DBNAME}` //数据库的连接配置
    }),
    cookie: {
        httpOnly: false, // 开启后前端无法通过 JS 操作
         maxAge: 1000 * 60 * 60 * 24 * 7, // 这一条 是控制 sessionID 的过期时间的！！！
        secure: false, // 只在HTTPS下传输cookie
        sameSite: 'none',
    },
}))
//解析token
function verifyToken(token) {
    const secretKey = 'UGCC_nieheihei817_FoX8107_copyright_2024_ugccTeam_';
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return null;
    }
}
// 要追加到的文件路径
const logPath = path.join(__dirname, './logs/log.txt')
// 定时任务：每天24点写入分割内容到 txt 文件
const formattedDate = new Date().toISOString().split('T')[0];
schedule('0 0 0 * * *', () => {
    const content = `\n--------------${formattedDate}------------\n`;
    fs.appendFile(path.join(__dirname,'./logs/log.txt'), content, (err) => {
        if (err) throw err;
        console.log('内容已写入到 log.txt 文件');
    });
});
app.use((req, res, next) => {
    const now = new Date();

    // 获取各个部分
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需加1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // 格式化为 yyyy-mm-dd hh:mm:ss
    const nowDate =  `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    switch (req.path){
        case '/api/login':
            fs.appendFile(logPath, `${nowDate}  ${req.body.username} 登录操作\n`, (err) => {
                if (err) {
                    console.error('追加文件时发生错误:', err);
                    return;
                }
                console.log('内容已成功追加到文件！');
            });
            break
       case '/api/signUp':
           fs.appendFile(logPath, `${nowDate}  ${req.body.username} 注册了用户 ${req.body.username},权限组${req.body.permissionDes}\n`, (err) => {
               if (err) {
                   console.error('追加文件时发生错误:', err);
                   return;
               }
               console.log('内容已成功追加到文件！');
           });
           break
        case '/api/createArticle':
            const username = verifyToken(req.headers.token).username
            fs.appendFile(logPath, `${nowDate}  ${username} 创建文章 ${req.body.content[0].title.toString()}\n`, (err) => {
                if (err) {
                    console.error('追加文件时发生错误:', err);
                    return;
                }
                console.log('内容已成功追加到文件！');
            });
            break
        case '/api/overwriteArticle':
            fs.appendFile(logPath, `${nowDate}  ${verifyToken(req.headers.token).username} 修改文章 ${req.body.articleID} ,改为${req.body.content[0].title.toString()}\n`, (err) => {
                if (err) {
                    console.error('追加文件时发生错误:', err);
                    return;
                }
                console.log('内容已成功追加到文件！');
            });
            break
        case '/api/deleteArticle':
            fs.appendFile(logPath, `${nowDate}  ${verifyToken(req.headers.token).username} 删除文章 ${req.body.articleID}\n`, (err) => {
                if (err) {
                    console.error('追加文件时发生错误:', err);
                    return;
                }
                console.log('内容已成功追加到文件！');
            });
            break
    }
    return next();
});
app.use(loginRoutes)
app.use(articleRoutes)
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))
db(()=>{

    console.log('MongoDB Connected!')
        //新增
    // UserModel.create({
    //     username: "MoyanInk",
    //     password:"yss1705",
    //     permissions:"writer",
    //     permissionDes:"文档开发者",
    //     avatar:"https://pic.imgdb.cn/item/66cc4b96d9c307b7e96ea6e2.jpg"
    // })
    //     .then(result => {
    //         console.logs('Document created successfully:', result);
    //     })
    //     .catch(error => {
    //         console.error('Error creating document:', error);
    //     });

},()=>{
    console.log("连接失败")
})
// // 启动服务器 监听80默认端口，监听本地ip
app.listen(80, "0.0.0.0", () => {
    console.log('Express server started');
});
//创建 HTTPS 服务器并监听 443 端口
// https.createServer(options, app).listen(27020, "0.0.0.0",() => {
//     console.log("Server running");
// });
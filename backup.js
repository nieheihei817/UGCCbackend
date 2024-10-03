const mongoose = require('mongoose')
const {DBHOST,DBPORT,DBNAME} = require('./config')
const db = require('./db')
const UserModel = require('./models/UserModel')
const express = require("express");
const app = express();
const cors = require('cors');
const loginRoutes = require('./routes/loginRoutes');
// 使用 body-parser 中间件
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// CORS 中间件配置
app.use(cors({
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200 // 一些旧版浏览器 (IE11, various SmartTVs) 对 204 响应不兼容
}));
mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`)
mongoose.set('strictQuery',true)
db(()=>{
    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        console.log(username,password);
        UserModel.findOne({ username: username.toString(), password: password.toString() })
        .then(userData => {
            if (userData) {
                res.json({
                    "state": "success",
                    "_id": userData._id,
                });
            } else {
                res.json({
                    "state": "noData"
                });
            }
        })
        .catch(err => {
            console.error('Error:', err);
            res.json({
                "state": "noData",
            });
        });
    });
    console.log('MongoDB Connected!')
        //新增
    UserModel.create({
        username: "test",
        password:"1234567",
        permissions:"superAdmin"
    })
        .then(result => {
            console.log('Document created successfully:', result);
        })
        .catch(error => {
            console.error('Error creating document:', error);
        });

},()=>{
    console.log("连接失败")
})
// 启动服务器
app.listen(80, "localhost", () => {
    console.log('Express server started');
});
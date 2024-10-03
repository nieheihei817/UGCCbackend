const express = require("express");
const app = express();
const session = require('express-session');
app.use(session({
    name: 'sessionid',   //设置cookie的name，默认值是：connect.sid
    secret: 'UGCC-nieheihei-2020-08-17-copyright', //参与加密的字符串（又称签名）  加盐
    saveUninitialized: false, //是否为每次请求都设置一个cookie用来存储session的id
    resave: true,  //是否在每次请求时重新保存session
}))
app.get('/', (req, res) => {
    req.session.username = "aaa";
    req.session._id = "123"
    console.log(req.session);
    res.send("ok")
})
app.listen(80, "localhost", () => {
    console.log('Express server started');
});
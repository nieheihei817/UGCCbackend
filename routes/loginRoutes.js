const express = require('express');
const bodyParser = require("body-parser");
const UserModel = require("../models/UserModel");
const SessionsModel = require("../models/SessionsModel");
const {parse} = require("node:querystring");

const router = express.Router();
// 使用 body-parser 中间件
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const jwt = require('jsonwebtoken');
const {readFileSync} = require("node:fs");
const {join} = require("node:path");



// 生成 token 的函数
function generateToken(user) {
    // 密钥，用于签名和验证 token
    const secretKey = 'UGCC_nieheihei817_FoX8107_copyright_2024_ugccTeam_';
    // 生成 JWT token
    return jwt.sign(user, secretKey, { expiresIn: '336h' }); // token 有效期为 14天

}


router.post("/api/ID",(req,res)=>{
    const {ID} = req.body
    console.log("当前id"+ID)
    UserModel.findOne({_id:ID}).then((userData)=>{
        res.json(userData)
    }).catch(err => {
        console.error('Error:', err);
        res.status(500).json({
            "state": "error",
            "message": "Internal server error"
        });
    });
})
// 登录接口
router.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    UserModel.findOne({ username: username, password: password })
        .then(userData => {
            if (userData) {
                const user = new Object({
                    uid: userData._id,
                    username: userData.username,
                    tokenDate: (Date.now()+14 * 24 * 60 * 60 * 1000).toString()
                })
                const token = generateToken(user)
                console.log("令牌"+token)
                // res.cookie("token",token ,{ maxAge: 1000*60*60*24*14, httpOnly: false });
                // res.cookie("user",JSON.stringify(user),{ maxAge: 1000*60*60*24*14, httpOnly: false });

                res.json({
                    "state": "success",
                    "token": token,
                });
            }
            if(!userData) {
                res.json({
                    "state": "noData"
                });
            }
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({
                "state": "error",
                "message": "Internal server error"
            });
        });
});
// 注册接口
router.post('/api/signUp', (req, res) => {
    const { username, password,permissions,permissionDes,avatar } = req.body;
    console.log(username,permissions);
    //新增
    UserModel.create({
        username: username,
        password:password,
        permissions:permissions,
        permissionDes:permissionDes,
        avatar:avatar
    })
        .then(result => {
            res.json({
                code:200,
                state:"success"
            })
            console.log('Document created successfully:', result);
        })
        .catch(error => {
            console.error('Error creating document:', error);
        });
});
// 删除用户接口
router.post('/api/deleteUser', (req, res) => {
    const { username } = req.body;
    //新增
    UserModel.findOneAndDelete({
        username: username,
    })
        .then(result => {
            res.json({
                code:200,
                state:"success"
            })
            console.log('Document deleted successfully:', result);
        })
        .catch(error => {
            console.error('Error deleting document:', error);
        });
});
function verifyToken(token) {
    const secretKey = 'UGCC_nieheihei817_FoX8107_copyright_2024_ugccTeam_';
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return null;
    }
}
router.post("/api/verifyToken",(req,res)=>{
    const token = verifyToken(req.body.token)
    console.log("过期时间"+token.tokenDate)
    UserModel.findOne({_id:token.uid}).then((userData)=>{
        res.json({
            code:200,
            state:"success",
            userData:{
                uid:userData._id,
                username:userData.username,
                permissions:userData.permissions,
                permissionDes:userData.permissionDes,
                avatar:userData.avatar
            }
        })
    }).catch(err => {
        console.error('Error:', err);
        res.status(500).json({
            code:403,
            "state": "noData"
        });
    });
})
router.post("/api/webSiteLog",(req,res)=>{
	try {
	    const data = readFileSync(join(__dirname,'../logs/log.txt'), 'utf8');
	    console.log('文件内容:', data);
        res.json({
            code:200,
            content:data
        })
	} catch (err) {
	    console.error('读取文件时出错:', err);
	}

})
router.post("/api/exportLog",(req,res)=>{
    const filePath = join(__dirname, '../logs/log.txt'); // 文件路径
    res.download(filePath, 'log.txt', (err) => {
        if (err) {
            console.error('File download error:', err);
            res.status(500).send('Error downloading file.');
        }
    });

})
module.exports = router;
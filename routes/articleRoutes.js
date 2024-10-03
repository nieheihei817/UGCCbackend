const express = require('express');
const bodyParser = require("body-parser");
const UserModel = require("../models/UserModel");
const ArticleModel = require("../models/ArticleModel");
const fs = require("fs");
const {parse} = require("node:querystring");
const path = require("path");
const jwt = require("jsonwebtoken");
const deepDiff = require('deep-diff').diff;
const multer = require('multer');
const {DBHOST, DBPORT, USERNAME, PASSWORD, DBNAME} = require("../config");
const router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb://${USERNAME}:${PASSWORD}@${DBHOST}:${DBPORT}/${DBNAME}` //数据库的连接配置;
const client = new MongoClient(uri, {
    maxPoolSize: 10, // 最大连接池大小
    serverSelectionTimeoutMS: 5000, // 服务器选择超时时间
    socketTimeoutMS: 30000, // Socket 超时时间
    connectTimeoutMS: 30000, // 连接超时时间
});
// 配置 Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
// 使用 body-parser 中间件
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
// const obj1 = { name: 'Alice', age: 30 };
// const obj2 = { name: 'A', age: 31 };
//
// const differences = deepDiff(obj1, obj2);
// console.logs(differences);

//验证令牌
function verifyToken(token) {
    const secretKey = 'UGCC_nieheihei817_FoX8107_copyright_2024_ugccTeam_';
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return null;
    }
}

// 处理多个文件上传
router.post('/api/uploadImage', upload.array('wangeditor-uploaded-image'), (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    const fileUrls = files.map(file => "https://www.ugcc.fun/"+"images/"+`${file.filename}`);
    console.log("图片路径"+fileUrls)
    res.json({
        errno: 0, // 注意：值是数字，不能是字符串
        data:{
            url: fileUrls.toString()
        }
    });
});
router.post("/api/deleteImage", (req, res) => {
    for(let i of req.body.deleteImgLst){
        const last17Chars = i.src.slice(-17);  // 也可以使用 str.substring(str.length - 17)
        fs.unlinkSync(path.join(__dirname, '../public/images',last17Chars));
    }
    res.json({
        code:200
    })
})
//上传图片 转换成base64字符串写入后端图片文件
router.get("/api/downloadGame", (req, res) => {
    // APK 文件路径
    const filePath = path.join(__dirname, '../public/app-release_sign.apk'); // 替换为实际 APK 文件的路径
    // 检查文件是否存在
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('File not found');
            return;
        }

        // 设置响应头以便下载文件
        res.download(filePath, "app-release_sign.apk", err =>{
            if (err) {
                res.status(500).send('Error downloading file.');
            }
        });
        console.log("下载成功")
    });
})

// 新增文章
// 创建文章并轮询以确认是否创建成功
router.post('/api/createArticle', async (req, res) => {
    try {
        const title = req.body.content[0].title.toString();
        const article = req.body.content.slice(1);
        const author = verifyToken(req.headers.token).username;
        const articleType = req.body.articleType;
        const textContent = req.body.textContent;
        const articleDate = new Date().toDateString();
        const articleID = Math.floor(Date.now() / 1000).toString();

        // 创建文章
        await ArticleModel.create({
            title,
            article,
            author,
            articleType,
            textContent,
            articleID,
            date: articleDate
        });

        // 轮询检查文章是否成功创建
        const checkArticleExists = async (id) => {
            let attempts = 0;
            const maxAttempts = 10; // 最大尝试次数
            const interval = 500; // 轮询间隔 (毫秒)

            return new Promise((resolve, reject) => {
                const check = async () => {
                    attempts += 1;
                    try {
                        const article = await ArticleModel.findOne({ articleID: articleID });
                        if (article) {
                            resolve(article);
                        } else if (attempts >= maxAttempts) {
                            reject(new Error('Article not found after multiple attempts'));
                        } else {
                            setTimeout(check, interval);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                check();
            });
        };

        const articleA = await checkArticleExists(articleID);
        console.log('Article created and found successfully:', articleA);
        res.json({
            code: 200,
            msg: "发布成功"
        });
    } catch (error) {
        console.error('Error creating or finding Article:', error);
        res.status(500).json({ code: 404, msg: "文章上传失败" });
    }
});


// 获取文章
router.post("/api/getArticle", (req, res) => {
        ArticleModel.find()
            .then(result => {
                let articlesLst = []
                for(let i of result){
                    articlesLst.push(
                        new Object({
                            title:i.title,
                            articleType:i.articleType,
                            articleID:i.articleID
                        })
                    )
                }
                console.log('Article founded successfully:', result);
                res.json({
                    code: 200,
                    articles:articlesLst
                })
            })
            .catch(error => {
                console.error('Error creating Article:', error);
            });
})
// 获取文章具体内容
router.post("/api/getArticleContent", (req, res) => {
        let articleID = req.body.articleID
        ArticleModel.findOne({articleID:articleID})
            .then(result => {
                res.json({
                    code: 200,
                    article:result
                })
            })
            .catch(error => {
                console.error('Error creating Article:', error);
            });
})
// 获取指定用户的文章
router.post("/api/getUserArticles", (req, res) => {
    const token = req.headers.token
    console.log("修改令牌", JSON.stringify(verifyToken(token), null, 2));

    const username = verifyToken(token).username
    const uid = verifyToken(token).uid
    console.log("用户名",username)
    console.log("用户ID",uid)
    UserModel.findOne({_id:uid}).then(result => {
        if(result.permissions==="admin"||result.permissions==="superAdmin"){
            console.log(result)
            console.log('管理员权限')
            ArticleModel.find({})
                .then(result => {
                    res.json({
                        code: 200,
                        articles:result,
                    })
                })
                .catch(error => {
                    console.error('Error creating Article:', error);
                });
        }else{
            ArticleModel.find({author:username})
                .then(result => {
                    console.log('其他权限')
                    res.json({
                        code: 200,
                        articles:result,
                    })
                })
                .catch(error => {
                    console.error('Error creating Article:', error);
                });
        }
    })
        .catch(error => {
            console.error('Error finding Article:', error);
        });
})
// 覆写文章
// 将对象写入文件
// 新增的数据
const newData = { newKey: 'newValue' };



router.post("/api/overwriteArticle", async (req, res) => {
    try {
        const title = req.body.content[0].title.toString();
        const newArticle = req.body.content.slice(1);
        const author = verifyToken(req.headers.token).username;
        const articleType = req.body.articleType;
        const textContent = req.body.textContent;
        const articleDate = new Date().toDateString();
        const articleID = req.body.articleID;
        const newArticleID = Math.floor(Date.now() / 1000).toString();

        // 修改文章
        await ArticleModel.findOneAndUpdate({articleID: articleID}, {
            $set: {
                title: title,
                article: newArticle,
                author: author,
                articleType: articleType,
                textContent: textContent,
                date: articleDate
            }
        })

        // 轮询检查文章是否成功创建
        const checkArticleExists = async (id) => {
            let attempts = 0;
            const maxAttempts = 10; // 最大尝试次数
            const interval = 500; // 轮询间隔 (毫秒)

            return new Promise((resolve, reject) => {
                const check = async () => {
                    attempts += 1;
                    try {
                        const article = await ArticleModel.findOne({article: newArticle});
                        if (article) {
                            resolve(article);
                        } else if (attempts >= maxAttempts) {
                            reject(new Error('Article not found after multiple attempts'));
                        } else {
                            setTimeout(check, interval);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                check();
            });
        };

        const articleA = await checkArticleExists(articleID);
        console.log('Article created and found successfully:', articleA);
        res.json({
            code: 200,
            msg: "修改成功"
        });
    } catch (error) {
        console.error('Error creating or finding Article:', error);
        res.status(500).json({code: 404, msg: "文章修改失败"});
    }
})
// 删除文章
router.post("/api/deleteArticle", (req, res) => {
    const token = req.headers.token
    const articleID = req.body.articleID
    // 删除文章的所有图片
    ArticleModel.findOne({articleID:articleID})
        .then(result => {
            for(let i of result.article){
                if(i.img){
                    let src = i.src.slice(-15);
                    console.log('获取到img'+src)
                    fs.unlinkSync(path.join(__dirname, '../public/images',src));
                }
            }
            res.json({
                code: 200,
            })
        })
        .catch(error => {
            console.error('Error creating Article:', error);
        });
    // 删除文章
    ArticleModel.findOneAndDelete({articleID:articleID})
        .then(result => {
            res.json({
                code: 200,
            })
        })
        .catch(error => {
            console.error('Error creating Article:', error);
        });
})
// 暴露路由
module.exports = router;
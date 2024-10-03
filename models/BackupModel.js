const mongoose = require('mongoose');
const {any} = require("webidl-conversions");
const {Schema} = require("mongoose");
let BackupSchema = new mongoose.Schema({
    title: String,
    article: Array,
    author: String,
    articleType: String,
    textContent: Schema.Types.Mixed,
    articleID:String,
    date: String
})

//创建模型对象
let BackupModel = mongoose.model('articles',BackupSchema)  //books为集合名称，BookSchema为选用模式，此处实例化了一个名为BookModel的模型对象

module.exports = BackupModel
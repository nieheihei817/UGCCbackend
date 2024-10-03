const mongoose = require('mongoose');
const {any} = require("webidl-conversions");
const {Schema} = require("mongoose");
let SessionsSchema = new mongoose.Schema({
    _id: Schema.Types.Mixed,
    expires: Schema.Types.Mixed,
    session:Schema.Types.Mixed,
})

//创建模型对象
let SessionsModel = mongoose.model('sessions',SessionsSchema)  //books为集合名称，BookSchema为选用模式，此处实例化了一个名为BookModel的模型对象

module.exports = SessionsModel
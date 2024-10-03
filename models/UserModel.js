const mongoose = require('mongoose');
let UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    permissions:String,
    permissionDes:String,
    avatar:String
})

//创建模型对象
let UserModel = mongoose.model('users',UserSchema)  //books为集合名称，BookSchema为选用模式，此处实例化了一个名为BookModel的模型对象

module.exports = UserModel
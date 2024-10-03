const mongoose = require("mongoose");

module.exports = function (success,error) {
    const mongoose = require("mongoose");
    const {DBHOST, DBPORT, DBNAME,USERNAME,PASSWORD} = require("./config");
    mongoose.connect(`mongodb://${USERNAME}:${PASSWORD}@${DBHOST}:${DBPORT}/${DBNAME}`)
    mongoose.set('strictQuery', true)
    mongoose.connection.once('open', () => {
        console.log('MongoDB Connected!')
        success()
    })
    mongoose.connection.once('error', () => {
        error()
    })
}
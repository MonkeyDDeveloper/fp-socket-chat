if(process.env.ENV != 'production')
    require('dotenv').config()
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const mongoose = require('mongoose');
const views = path.join(__dirname, 'views');
const port = process.env.PORT || 3000;

//database
const connection = mongoose.createConnection(process.env.DB_URI, err => console.log('db connected', err))
const Message = connection.model('Messages', {
    name: String,
    message: String
})
//

app.set('view engine', 'pug')
app.set('views', views)

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/public', express.static(path.join(__dirname, 'assets')))

app.get('/', async (req, res) => {
    let messages = await Message.find({})
    res.render('index', {messages})
})

app.post('/new-message', async (req, res) => {
    try {
        let newMessage = new Message(req.body)
        await newMessage.save()
        let badWords = await Message.find({message: {$regex:"badword"}})
        if(badWords.length > 0) 
            await Message.deleteMany({message:{$regex:"badword"}})
        else 
            io.emit('new-message', req.body)
        res.sendStatus(200)
    }
    catch(err){
        console.log(err.message)
        res.sendStatus(500)
    }
})

// io.on('connection', () => console.log('conectado'))

server.listen(port, () => console.log(`App listening on port ${port}`))
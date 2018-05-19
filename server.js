var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
app.use(bodyParser.urlencoded({ extended: true }));

var path = require('path');

var flash = require('express-flash');


var session = require('express-session');

app.use(session({
    secret: 'penguinsrock',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
app.use(flash());

mongoose.connect('mongodb://localhost/messageboard');

//The Last ID collection has been created in the database before hand
// It looks like this {_id: objectId, message:0, comment:0}

mongoose.model('LastId',
                new mongoose.Schema({message: Number, comment: Number}),
                'lastId');
var Id = mongoose.model('LastId')
const CommentSchema = new mongoose.Schema({
    name: {type:String, required: [true, "User must have a name"]},
    content: {type: String, required: [true, "Comment must have content"]},
    comment_id: {type: Number}
}, {timestamps: true})
const MessageSchema = new mongoose.Schema({
    name: {type:String, required: [true, "User must have a name"]},
    content: {type: String, required: [true, "Message must have content"]},
    comments: [CommentSchema],
    message_id: {type: Number}
}, {timestamps: true})

mongoose.model('Message', MessageSchema);
var Message = mongoose.model('Message')
mongoose.model('Comment', CommentSchema);
var Comment = mongoose.model('Comment')

app.use(express.static(path.join(__dirname, './static')));

app.set('views', path.join(__dirname, './views'));

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    Message.find({}, function(err, messages) {
        if (err) {console.log('error finding messages'); }
        Comment.find({}, function(err, comments) {
            if (err) {console.log('error finding comments');}
            res.render('index', {messages: messages,
                                comments: comments});
        })
    })
    console.log('finding messages, comments');
});

app.post('/messages', function(req, res) {
    console.log("POST DATA", req.body);
    Id.find({}, function(err, lastId){
        console.log(lastId[0].message)
        if (err) {console.log('unable to find lastId')}
        else {
            lastId[0].message += 1
            var message = new Message({name: req.body.name, content: req.body.content, message_id: lastId[0].message});
            message.save(function(err) {
                if(err) {
                    console.log('posting message went wrong');
                    for(var key in err.errors){
                        req.flash('form_validation', err.errors[key].message);
                        return res.redirect('/')
                    }
                } else { 
                    lastId[0].save(function(err){ console.log('not incrementing')})
                    console.log('successfully added a message!');
                    res.redirect('/');
                }
            })

        }
    })
    
})
app.post('/comments', function(req, res) {
    console.log("POST DATA", req.body);
    Id.find({}, function(err, lastId){
        console.log(lastId[0].comment)
        if (err) {console.log('unable to find lastId')}
        else {
            lastId[0].comment += 1
            var comment = new Comment({name: req.body.name, content: req.body.content, comment_id: lastId[0].comment});
            comment.save(function(err) {
                if(err) {
                    console.log('posting comment went wrong');
                    for(var key in err.errors){
                        req.flash('form_validation', err.errors[key].message);
                        return res.redirect('/')
                    }
                } else { 
                    lastId[0].save(function(err){ console.log('not incrementing')})
                    Message.findOne({message_id: req.body.msg_id}, function(err, data){  
                        console.log('Data:', data)
                        if(err){
                            console.log('hello')
                            return res.redirect('/')
                        } else {
                            data.comments.push({name: req.body.name, content: req.body.content, comment_id: lastId[0].comment})
                            data.save(function(err){
                                if(err){
                                    console.log('what am i doing')
                                    return res.redirect('/')
                                } else {
                                    res.redirect('/')
                                }
                            })
                            console.log('goodbye')
                        }
                    })
                    console.log('successfully added a comment!');
                }
            })

        }
    })
    
})

app.listen(8000, function() {
    console.log("listening on port 8000");
})
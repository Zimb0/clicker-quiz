'use strict';
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    port = process.env.PORT || 9000,
    auth = require('./app/routes/auth'),
    server = require('http').createServer(app),
    io = require('socket.io')(server);
mongoose.connect('mongodb://localhost:27018/quiz');
var corsOptions = {
    "origin": "http://localhost:3000",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

server.listen(port, function () {
    console.log('Server is running at port 9000');
});
app.post('/api/auth', auth.login);
app.post('/api/logout', auth.logout);
/*Anfrage wird erst bearbeitet wenn request bearbeitet wird
 * anschließend gehts zur api*/
app.use([require('./app/middlewares/validateRequest')]);
//TODO hier kommen alle anwendungsrouten rein
app.use('/api/quizes', require('./app/routes/quiz.js'));
app.use('/api/users', require('./app/routes/user.js'));
app.use('/api/questions', require('./app/routes/question.js'));


console.log('Magic happens on port ' + port);

io.use(function (socket, next) {
    var handshake = socket.handshake;
    console.log(handshake.query);
    console.log(handshake.extra);
    next();
});


var Quiz = require('./app/models/quiz'),
    Answer = require('./app/models/answer');

// Socket.io Funktionen

// Fragen / Antworten mischen
function shuffle(array) {

    for (var j, x, i = array.length; i; j = Math.floor(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x);
    return array;
}

io.on('connection', function (socket) {

    var quizData;
    var counter;
    var timerStop = false;
    var correct;
    var result;
    var currentTime;
    var tid;
    var currentQuiz = new Quiz;
    var answ;


    console.log("Socket.io connection done");


    socket.on('joinQuiz', function (quiz, currentUser) {

        currentQuiz = quiz;
        // console.log("QQQQQQQQQQQQQQQQQ:");
        //console.log(currentQuiz);
        //console.log(currentUser);

        //console.log("QQQ befüllt:");
        // console.log(currentQuiz);

        if (currentQuiz.key === quiz.password) {
            console.log("in der IF");
            socket.join(quiz._id);
            var rooms = io.sockets.adapter.rooms;
            console.log("alle räume: ");
            console.log(rooms);
            // var clientNumber = io.sockets.adapter.rooms[quizId];
            //  console.log("ClientNumbers from currentRoom");
            //  console.log(clientNumber);


            console.log("eigene socketID: ");
            console.log(socket.id);
            console.log('User ist im Quiz ' + quiz._id);
            // User in Warteraum schicken
            socket.emit('waitingRoom', currentQuiz.qname);

            //socket.emit('joinedQuiz', currentQuiz.qname);


        } else {

            socket.emit('passwordFalse');
        }

        socket.on('ttt', function () {
            console.log("TTTTTT");
            io.to(quiz._id).emit('message');
            // socket.to(quiz._id).emit('message');


        });


    });

    socket.on('answer', function (answer, question, user) {

        console.log("NEUNEUNEU");
        console.log(answer);
        console.log(question);
        console.log("CurrenQuiz");
        console.log(currentQuiz);

        saveAnswer(answer, question, user);




    });
    socket.on('start', function (id) {
        console.log("START");
        socket.emit('startQuiz', id);
    });


    socket.on('getQuizzes', function () {
        Quiz.find(function (err, quizes) {
            if (err) {
                res.send(err);
            }
            //   console.log(quizes);
            socket.emit('printQuizzes', quizes);
        });

    });


    socket.on('requestQuiz', function () {
        console.log(socket.id);
            counter = 0;
        socket.emit('printQuiz', currentQuiz);
            quizData = currentQuiz;
            shuffle(quizData.questions);


        });


    function saveAnswer(ans, ques, user) {
        console.log("ANSWER");
        console.log(ans);
        console.log("FRAGE Question.question");
        console.log(ques);
        var questionName = ques.question,
            questionPoints;

        if (result === ans) {
            console.log("richtig");
            socket.emit('result', result = true);
            questionPoints = ques.points;
        } else {
            console.log("falsch");
            socket.emit('result', result = false);
            questionPoints = 0;
        }

        var a = new Answer({
            question: questionName,
            answer: ans,
            result: result,
            userId: String,
            kurzel: user,
            quizId: currentQuiz._id,
            points: questionPoints,
            delete: Boolean
            //time: Date
        });

        //Answer.update(a);
        console.log("DAAAAAAATAA");

        answ = a;

        a.save(function (err, a) {
            console.log("SAVEEEEEE");
            if (err) return console.error(err);
            console.dir(a);
        });
        console.log("ANSWEEEERER");
        //console.log(Answer)
        return answ;
    }

    socket.on('requestLecturerResult', function (id) {
        console.log("im Socket requestLecturerResult");
        /*Answer.find({ quizId: id }, function(err, answers) {
         if (err) return console.error(err);
         console.log("!!!!!!!!!!!");
         console.dir(answers);
         return answers
         });*/
        Answer.aggregate([
            {
                $match: {
                    quizId: id,
                    kurzel: "mz059"
                }
            },
            {
                $group: {
                    _id: "quizId",
                    sumPoints: {$sum: "$points"}
                }
            }
        ], function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("RESULT");
            console.log(result);
            socket.emit('UserSumPoints', result);
        });

    });

    socket.on('nextQuestion', function () {
        console.log(counter);
        console.log(socket.id);
        if (counter < currentQuiz.questions.length) {
            var question = currentQuiz.questions[counter];
            correct = question.answer1;

            var answers = [question.answer1, question.answer2, question.answer3, question.answer4];
            shuffle(answers);
            var temp = shuffle(answers);

            if (temp) {

                question.answers = temp;
            }

            var currentQuestion = {
                question: question.question,
                answers: answers,
                points: question.points,
                time: question.time
            };

            socket.emit('printQuestion', currentQuestion);
            socket.emit('printTime', question.time);
            counter++;
        } else {
            if (counter === currentQuiz.questions.length) {
                console.log("Quiz fertig");
                socket.emit('endQuiz');
                timerStop = true;
                //countDown(0);
            }
        }
    });


    socket.on('countDown', function (question) {
        console.log(socket.id);


        timerStop = false;
        abortTimer();
        // time = 20;
        currentTime = question.time;

        tid = setTimeout(decrease, 1000);

        // set timeout


        function decrease() {
            if (currentTime === 0 || timerStop === true) {

                socket.emit('printTime', currentTime);
                //  saveAnswer(null);
                abortTimer();
                console.log("STOP");
            } else {
                socket.emit('printTime', currentTime);
                currentTime--;


                tid = setTimeout(decrease, 1000);
        }

            console.log(currentTime);

            // do some stuff...
            // repeat myself
    }

        function abortTimer() { // to be called when you want to stop the timer
            clearTimeout(tid);
        }

    });

    socket.on('disconnect', function () {
        console.log('Socket.io connection disconnect');
    })
});
/*
 'use strict';
 var express = require('express');
 var app = express();
 var server = require('http').createServer(app);
 var io = require('socket.io')(server);
 var port = process.env.PORT || 9000;
 server.listen(port, function () {
 console.log('Server is running at port 9000');
 });
 function getRooms() {
 return [
 'IT-Advanced',
 'Informatik'
 ];
 }
 function dice() {
 return (Math.random());
 }
 io.on('connection', function (socket) {
 console.log(socket);
 socket.on('requestRooms', function () {
 socket.emit('printRooms', getRooms());
 });
 socket.on('doDice', function (room) {
 if(socket.adapter.rooms[room]){
 console.log('es wird gewürfelt');
 io.to(room).emit('diceResults', dice());
 }else{
 console.log('User nicht im Raum');
 }
 });
 socket.on('joinRoom', function (room) {
 console.log('User will in den Raum' + room);
 if (getRooms().indexOf(room) > -1) {
 socket.join(room);
 console.log('User ist im Raum' + room);
 socket.emit('joinedRoom', room);
 }
 else {
 console.log('error: Raum gibt es nicht');
 }
 });
 socket.on('disconnect', function() {
 console.log('User disconnected from room');
 });
 });
 */
/* cheat sheet
 // sending to sender-client only
 socket.emit('message', "this is a test");
 // sending to all clients, include sender
 io.emit('message', "this is a test");
 // sending to all clients except sender
 socket.broadcast.emit('message', "this is a test");
 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');
 // sending to all clients in 'game' room(channel), include sender
 io.in('game').emit('message', 'cool game');
 // sending to sender client, only if they are in 'game' room(channel)
 socket.to('game').emit('message', 'enjoy the game');
 // sending to all clients in namespace 'myNamespace', include sender
 io.of('myNamespace').emit('message', 'gg');
 // sending to individual socketid
 socket.broadcast.to(socketid).emit('message', 'for your eyes only');
 */
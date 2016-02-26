/**
 * Created by maikzimmermann on 11.02.16.
 */

(function () {
    'use strict';

    angular
        .module('app.quizSingleStudent', [])                                     // creates new module
        .config(config)                                             // config function for our module app.list
        .controller('startCtrl', startCtrl);                          // bind ListCtrl to module


    function config($stateProvider) {
        // inject $stateProvider into config object
        $stateProvider
            .state('quizSingleStudent', {                                        // declare list view
                url: '/quizSingleStudent/:id',                                       // set url
                templateUrl: 'routes/student/quizSingleStudent/quizSingleStudent.html',           // defines the HTML template
                controller: 'startCtrl as vm'                              // this view shall use the ListCtrl previously declared.
            });
    }

    function startCtrl($stateParams, $state, $timeout, socket, $localStorage) {// our controller for this view
        var vm = this;
        var quizData;
        vm._id = 0;

        vm.quizSingleStudent = true;
        socket.emit('requestQuiz');
        socket.emit('nextQuestion');



        socket.on('printQuiz', function (quiz) {
            vm.quiz = quiz;
            quizData = vm.quiz.questions;
        });


        socket.on('endQuiz', function () {
            console.log("END");
            $state.go('quiz');
        });

        socket.on('printTime', function (time) {

            if (time == 0) {
                socket.emit('nextQuestion');
            }

            var min = time / 60;
            var sek = time % 60;
            var str = min.toString();
            str = str.substring(0, str.indexOf("."));
            vm.time = str + " Minuten " + sek + " Sekunden ";


        });

        socket.on('printQuestion', function (question) {
            vm.question = question;
            socket.emit('countDown', question);
        });

        socket.on('result', function (result) {
            console.log("im RESULT");
            socket.emit('nextQuestion');

            if (result == true) {
                vm.result = "RICHTIG";
            } else {
                vm.result = "FALSCH";
            }


        });


        vm.answerButton = function (answer, question) {
            var user = $localStorage.user;
            console.log(answer);
            console.log(user);
            socket.emit('answer', answer, question, user);
            socket.emit('nextQuestion');
        };


    }
})();
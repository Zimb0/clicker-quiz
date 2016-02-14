(function () {
    'use strict';

    angular
        .module('app.quizSingle', ['ngMaterial'])                   // creates new module
        .config(config)                             // config function for our module app.single
        .controller('qEditCtrl', qEditCtrl)           // bind EditCtrl to module
        .controller('qAddCtrl', qAddCtrl)
        .controller('dialogCtrl', dialogCtrl);



    // bind AddCtrl to module

    function config($stateProvider) {               // inject $stateProvider into config object

        $stateProvider                              // declare our two views ( both use the same template but have different controllers
            .state('qedit', {                        // edit state..
                url: '/qedit/:id',                   // url is '/edit/'+id as a url parameter ( check line  32 to see how we use the id with $stateParams
                templateUrl: 'routes/lecturer/quizSingle/quizSingle.html',       // defines the HTML template
                controller: 'qEditCtrl'              // this view shall use the EditCtrl previously declared.
            })

            .state('qadd', {                         // add view
                url: '/qadd',                        // this time without any parameters in the url
                templateUrl: 'routes/lecturer/quizSingle/quizSingle.html',   // loads the HTML template
                controller: 'qAddCtrl'               // this view shall use the AddCtrl previously declared.
            });


    }


    function qEditCtrl($stateParams, $scope, $http, $state) {    // inject stuff into our Ctrl Function so that we can use them.
        console.log($stateParams);
        $scope.edit = true;                                     // set the scope variable "edit" to true, anything that is within the scope is accessible from within the html template. See single.html line #5, ng if uses this

        $http({                                                 // http get requst to our api passing the id. this will load a specific user object
            method: 'GET',
            url: '/api/quizes/' + $stateParams.id
        }).then(function successCallback(response) {            // hint: async! when the data is fetched we do ..
            $scope.quiz = response.data;                        // load the response data to the scope.user obj
        });


        $scope.delete = function () {                           // declare a scope function ( which is also accessible from html template)
            $http({                                             // if button (single.html line 44) is clicked this function will send a DELETE request to our node server and passes the id
                method: 'DELETE',
                url: '/api/quizes/' + $stateParams.id
            }).then(function successCallback(response) {
                $state.go('quizList');                       // when the server responses we rediret to the list
            });
        };

        $scope.qsave = function () {                             // another scope function that will save a user object to our nodejs server
            $http({
                method: 'PUT',                                  // hint: learn http request verbs: get, put (change), delete
                data: $scope.quiz,                              // this passes the data from the user object  to the request.
                url: '/api/quizes/' + $stateParams.id
            }).then(function successCallback(response) {
                $state.go('quizList');
            });
        };
    }

    function qAddCtrl($scope, $http, $state, $mdDialog) {

        var vm = this;
        vm.selected = [];

        $http({                                                     // get all users from node server
            method: 'GET',
            url: '/api/questions'
        }).then(function successCallback(response) {
            vm.questions = response.data;                       // (async) when receive the response load the data into $scope.users


        });

        vm.exists = function (question) {


            return question.selected;


            // console.log(question);

        };

        vm.change = function (question) {
            var a = false;
            if (question.selected == true) {

                question.selected = false;

            } else {

                question.selected = true;

            }

            angular.forEach(vm.questions, function (question) {

                if (question.selected == true) {
                    a = true;
                }

            });

            if (a == true) {
                vm.button = true;
            }
            else {
                vm.button = false;
            }


        };

        vm.saveQuiz = function ($state) {
            var ergebnis = [];

            angular.forEach(vm.questions, function (question) {

                if (question.selected === true) {
                    ergebnis.push(question)
                }

            });


            var data = {
                qname: vm.qname,
                questions: ergebnis
            };

            // for new users we only need the save function
            $http({                                              // same as in the EditCtrl
                method: 'POST',
                data: data,
                url: '/api/quizes'
            }).then(function successCallback(response) {
                $state.go('quizList');

            })
        }


        vm.editDialog = function (ev, question) {

            $http({                                                 // http get requst to our api passing the id. this will load a specific user object
                method: 'GET',
                url: '/api/questions/' + question._id
            }).then(function successCallback(response) {            // hint: async! when the data is fetched we do ..
                console.log("Inhalt:" + response.data);
                vm.question = response.data;
                console.log("qcc" + vm.question);
                console.log(vm.question);


            });
            showDialog();

        };

        function showDialog(ev, question) {

            $mdDialog.show({

                controller: 'dialogCtrl',
                templateUrl: 'routes/lecturer/quizSingle/questionEditDialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })

        };

        vm.save = function (question) {

            question.changed = true;

        };


        vm.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.qsave = function () {                              // for new users we only need the save function
            $http({                                              // same as in the EditCtrl
                method: 'POST',
                data: $scope.quiz,
                url: '/api/quizes'
            }).then(function successCallback(response) {
                $state.go('quizList');
            });
        };

        vm.goDialog = function (id) {

            $mdDialog.show({

                controller: 'dialogCtrl',
                templateUrl: 'routes/lecturer/quizSingle/questionEditDialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                locals: {id: id}
            })

        };
    }


    function dialogCtrl($http, id) {
        var vm = this;
        console.log("dialogCtrl");
        console.log(id);









    }





})();

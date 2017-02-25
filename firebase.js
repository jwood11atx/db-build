var firebase = require("firebase");

var config = {
  apiKey: "AIzaSyA6dAV3gwmGQXotavP3j58sgwKFop3LUiM",
  authDomain: "bgg-api-test.firebaseapp.com",
  databaseURL: "https://bgg-api-test.firebaseio.com",
  storageBucket: "bgg-api-test.appspot.com",
  messagingSenderId: "394321547983"
};
firebase.initializeApp(config);

var database = firebase.database();

module.exports = {firebase, database};

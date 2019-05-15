var functions = require('firebase-functions');
var admin = require("firebase-admin");

var serviceAccount = require("./pwaKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagram-75ea1.firebaseio.com"
});
var cors = require('cors')({
    origin: true
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest(function (request, response) {
    //response.send('Hello world.')
    cors(request, response, function () {
        admin.database().ref('posts').push({
                id: request.body.id,
                title: request.body.title,
                location: request.body.location,
                image: request.body.image
            })
            .then(function () {
                response.status(201).json({
                    message: 'Data stored',
                    id: request.body.id
                });
            })
            .catch(function (err) {
                response.status(500).json({
                    error: error
                });
            })
    })
});
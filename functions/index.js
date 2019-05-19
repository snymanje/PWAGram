var functions = require('firebase-functions');
var admin = require("firebase-admin");
var cors = require('cors')({
    origin: true
});
var webpush = require('web-push');

var serviceAccount = require("./pwaKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagram-75ea1.firebaseio.com"
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
                webpush.setVapidDetails('mailto:jean.snyman@gmail.com', 'BCHMXjG9-wl_G735ZgBBfnqGHM37B-Lz3VI958MIAcM5RKnPneAb_sa-9t-H1UTaKSf7rc8imz5ZrKh6KzsNK8w', 'WaWrYqJqp7Sm2SDWBtnPff2sJrPMlhkttQ-amOMDobs');
                return admin.database().ref('subscriptions').once('value');
            })
            .then(function (subscriptions) {
                subscriptions.forEach(function (sub) {
                    var pushConfig = {
                        endpoint: sub.val().endpoint,
                        keys: {
                            auth: sub.val().keys.auth,
                            p256dh: sub.val().keys.p256dh
                        }
                    };
                    webpush.sendNotification(pushConfig, JSON.stringify({
                            title: 'New Post',
                            content: 'New Post added!',
                            openUrl: '/help'
                        }))
                        .catch(function (error) {
                            console.log(error);
                        })
                });
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
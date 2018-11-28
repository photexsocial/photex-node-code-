var User = require('../models/user');
var adminForReportedPosts = require('../models/adminReported');
var adminNotifications = require('../models/adminNotifications');
var adminNotifyCount = require('../models/adminNotify');
var Post = require('../models/post');
var Comment = require('../models/comment');
var Like = require('../models/like');
var ReportedPosts = require('../models/reportedPosts');
var Follower = require('../models/follower');
var Following = require('../models/following');
var shortid = require('shortid');
//var Notification = require('../models/notification');
var Notification = require('../models/notificationV2');
var NotifyCount = require('../models/notify');
var BlockUser = require('../models/blocked_user');
var commentReply = require('../models/comment_reply');
var userCountry = require('../models/userCountry');
var adNetwork = require('../models/adNetwork');
var Ads = require('../models/ads');
var Group = require('../models/group');
var LocalAds = require('../models/localads');
var IpLocation = require('../models/iptolocation');
var mongoose = require('mongoose');
var multer  = require('multer');
var fs = require('fs');
//var Chat = require('../models/chat');

var where = require('node-where');

var config = require('../authenticate.json'); //also upload the authenticate.json file on server
 //var jwt = require('jsonwebtoken'); // does not support token refresh
 var jwt = require('jsonwebtoken-refresh');

var FCM = require('fcm-push');
var async = require('async');
var Sequence =require('sequence').Sequence
    , sequence = Sequence.create()
    , err
;
var express = require('express');

var router = express.Router();


//ads
router.post('/ad/addAdNetwork', function (req, res) {
    var network = new adNetwork({
        'ad_network_name': req.body.ad_network_name,
        'status': req.body.status
    });
    network.save(function (err, network) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});
router.post('/ad/addAd', function (req, res) {
    var ads = new Ads({
        'ad_network_id': req.body.ad_network_id,
        'ad_network_name': req.body.ad_network_name,
        'ad_name': req.body.ad_name,
        'ad_small_image': req.body.ad_small_image,
        'description': req.body.description,
        'ad_large_image': req.body.ad_large_image,
        'app_url': req.body.app_url
    });
    ads.save(function (err, ad) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});
router.post('/ad/activeAdNetwork', function (req, res) {
    var q = adNetwork.find({status:true});
    q.lean().exec(function (err, adNetwork) {
        if(err){
            res.status(404).send({
                success: false,
                adNetwork: null
            })
        } else {
            res.send({
                success: true,
                adNetwork: adNetwork
            })
        }
    })
});

router.post('/user/addAdmin', function (req, res) {
    var admin = new adminForReportedPosts({
        'userName': req.body.userName.trim(),
        'password': req.body.password.trim()
    });
    admin.save(function (err, user) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

router.post('/user/adminSignIn', function (req, res) {
    adminForReportedPosts.findOne({userName: req.body.userName, password: req.body.password}, function (err, admin) {
        if (err) {
            res.status(404).send(
                {
                    success: false,
                    user: null
                }
            );
        } else if (admin) {

            res.send(
                {
                    success: true,
                    admin: admin
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false,
                    user: "Invalid Username/Password"
                }
            );
        }
    });
});

//update fcm key
router.post('/user/update_admin_fcm_key', function (req, res) {
    var query = {'_id': req.body.adminId};
    var user = new Object({
        'fcmKey': req.body.fcmKey
    });
    adminForReportedPosts.findOneAndUpdate(query, user, function (err, admin) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (admin) {
            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });
});

router.post('/user/getAdminNotificationsCount', function (req, res) {
    adminNotifyCount.findOne({adminId: req.body.adminId}, function (err, count) {
        if(err){
            res.status(404).send({
                success: false,
                count: null
            })
        }else {
            res.send(
                {
                    success: true,
                    count: count.total
                }
            );
        }
    });
});

router.post('/user/resetAdminNotificationsCount', function (req, res) {
    adminNotifyCount.findOneAndUpdate({adminId: req.body.adminId}, {
        $set: {total: 0}
    }, function (err) {
        //console.log(err);
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

router.post('/user/getAdminNotifications', function (req, res, next) {
    if (req.body.lastId == "0") {
        var q = adminNotifications.find({}).limit(20).sort({_id: -1});
        q.lean().exec(function (err, result) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        notification: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        notification: result
                    }
                );
            }
        });
    } else {
        var q = adminNotifications.find({_id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(20);
        q.lean().exec(function (err, result) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        notification: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        notification: result
                    }
                );
            }
        });
    }
});

//update user user emailId 'abc@gmail.com'
router.post('/update-emailId', function (req, res) {
    User.findOneAndUpdate({_id: req.body.userId},{$set: {emailId: req.body.email}}, function (err, done) {
        if(err) console.log('err');
        else res.send({success: true});
    });
});

//update user post caption
router.post('/update-post', function (req, res) {
   Post.findOneAndUpdate({_id: req.body.id},{$set: {caption: req.body.caption}}, function (err, done) {
      if(err) console.log('err');
      else res.send({success: true});
   });
});

//report post
router.post('/post/reportPost', function (req, res, next) {
    var post = new ReportedPosts({
        'reportedBy': req.body.reportedBy,
        'reason': req.body.reason,
        'postId': req.body.postId
    });
    post.save(function (err, post) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if(post){
            var notification = new adminNotifications({
                'reportedByFullName': req.body.reportedByFullName,
                'reportedByUserName': req.body.reportedByUserName,
                'reportedBy': req.body.reportedBy,
                'reportedByDisplayPicture': req.body.reportedByDisplayPicture,
                'postId': req.body.postId,
                'postBy': req.body.postBy,
                'notification_type':'report_post',
                'status':'unread'
            });

            notification.save(function (err, data) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else if(data){
                    adminForReportedPosts.findOne({}, function (err, adminData) {
                        if(err){
                            res.status(404).send({
                                success: false
                            });
                        }else{
                            var q = adminNotifyCount.findOne({adminId: adminData._id});
                            q.lean().exec(function (err, result) {
                                if (err) {
                                    res.status(404).send(
                                        {
                                            success: false,
                                            notification: null
                                        }
                                    );
                                } else if (result == null) {
                                    var notify = new adminNotifyCount({
                                        'total': 1,
                                        'adminId': adminData._id
                                    });
                                    notify.save(function (err, data) {
                                        if (err) {
                                            res.status(404).send({
                                                success: false
                                            });
                                        } else {
                                            if(adminData.fcmKey != "0") {
                                                var serverKey = 'AAAAvrXFN7M:APA91bGIVad4DsyszCbyV5zWumPstCjuuLFMGc3oTerTQtatPfh0LMTdr1tVHimOFKn8rHUtDNdpbcvEJQ-ibGqhlYD3ODbfY1fpx42ePL_nQH9yTb67CJQjNGidVpQ7mRIONEEkkLhT';
                                                var fcm = new FCM(serverKey);

                                                var message = {
                                                    to: adminData.fcmKey,
                                                    collapse_key: 'test',
                                                    data: {
                                                        your_custom_data_key: 'post_reported',
                                                        reportedByFullName: req.body.reportedByFullName,
                                                        reportedByUserName: req.body.reportedByUserName,
                                                        reportedBy: req.body.reportedBy,
                                                        reportedByDisplayPicture: req.body.reportedByDisplayPicture,
                                                        postId: req.body.postId,
                                                        postBy: req.body.postBy,
                                                        date:  new Date()
                                                    }
                                                };

                                                fcm.send(message)
                                                    .then(function(response){
                                                        console.log("Successfully sent with response: ", response);
                                                        res.send({
                                                            success: true
                                                        });
                                                    })
                                                    .catch(function(err){
                                                        console.log("Something has gone wrong! ReportPost 1");
                                                        console.error(err);
                                                        res.send({
                                                            success: false
                                                        });
                                                    })
                                            }else{
                                                res.send({
                                                    success: false
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    adminNotifyCount.findOneAndUpdate({adminId: adminData._id}, {
                                        $inc: {total: 1}
                                    }, function (err) {
                                        //console.log(err);
                                        if (err) {
                                            res.status(404).send({
                                                success: false
                                            });
                                        } else {
                                            if(adminData.fcmKey != "0") {
                                                var serverKey = 'AAAAvrXFN7M:APA91bGIVad4DsyszCbyV5zWumPstCjuuLFMGc3oTerTQtatPfh0LMTdr1tVHimOFKn8rHUtDNdpbcvEJQ-ibGqhlYD3ODbfY1fpx42ePL_nQH9yTb67CJQjNGidVpQ7mRIONEEkkLhT';
                                                var fcm = new FCM(serverKey);

                                                var message = {
                                                    to: adminData.fcmKey,
                                                    collapse_key: 'test',
                                                    data: {
                                                        your_custom_data_key: 'post_reported',
                                                        reportedByFullName: req.body.reportedByFullName,
                                                        reportedByUserName: req.body.reportedByUserName,
                                                        reportedBy: req.body.reportedBy,
                                                        reportedByDisplayPicture: req.body.reportedByDisplayPicture,
                                                        postId: req.body.postId,
                                                        postBy: req.body.postBy,
                                                        date: new Date()
                                                    }
                                                };

                                                fcm.send(message)
                                                    .then(function (response) {
                                                        console.log("Successfully sent with response: ", response);
                                                        res.send({
                                                            success: true
                                                        });
                                                    })
                                                    .catch(function (err) {
                                                        console.log("Something has gone wrong! ReportPost 2");
                                                        console.error(err);
                                                        res.send({
                                                            success: false
                                                        });
                                                    })
                                            }else{
                                                res.send({
                                                    success: false
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }else{
                    res.send({
                        success: false
                    });
                }
            });
        }else{
            res.send({
                success: false
            });
        }
    });
});

router.post('/post/deleteReportedPost', function (req, res, next) {
    ReportedPosts.where({_id: req.body.reportId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            Post.where({_id: data.postId}).findOneAndRemove(function (err, post) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else if (post) {
                    User.findOneAndUpdate({_id: post.userId}, {$inc: {totalPostsCount: -1}}, function (err) {
                        if (err) {
                            res.status(404).send({
                                success: false
                            });
                        } else {
                            res.send({
                                success: true
                            });
                        }
                    });
                } else {
                    res.status(404).send({
                        success: false
                    });
                }
            });
        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});

router.post('/post/getReportedPosts', function (req, res) {
    if (req.body.lastId == "0") {
        var q = ReportedPosts.find().limit(10).sort({_id:-1});
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Post.findOne({_id: post.postId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.userId = data.userId;
                                    post.fullName = data.fullName;
                                    post.postImageUrl = data.postImageUrl;
                                    post.height = data.height;
                                    post.width = data.width;
                                    post.date = data.date;
                                    post.location = data.location;
                                    post.tags = data.tags;
                                    post.caption = data.caption;
                                    post.likes = data.likes;
                                    post.comments = data.comments;
                                    post.latestComments = data.latestComments;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    } else {
        var q = ReportedPosts.find({_id: {'$lt': req.body.lastId}}).limit(10).sort({_id:-1});
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Post.findOne({_id: post.postId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.userId = data.userId;
                                    post.fullName = data.fullName;
                                    post.postImageUrl = data.postImageUrl;
                                    post.height = data.height;
                                    post.width = data.width;
                                    post.date = data.date;
                                    post.location = data.location;
                                    post.tags = data.tags;
                                    post.caption = data.caption;
                                    post.likes = data.likes;
                                    post.comments = data.comments;
                                    post.latestComments = data.latestComments;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    }
});

router.post('/user/getInfoByEmail', function (req, res) {
    var q = User.find({emailId:req.body.emailId});
    q.lean().exec(function (err, details) {
        if(err){
            res.status(404).send({
                success: false,
                details: null
            })
        } else {
            res.send({
                success: true,
                details: details
            })
        }
    })
});

router.post('/user/signup_user', function (req, res) {
    var folderName = shortid.generate();

    if(req.body.DeviceType != undefined && req.body.DeviceType != ''){
        var DeviceType = req.body.DeviceType;
        folderName = folderName+"_"+DeviceType;
    }

    var user = new User({
        'userName': req.body.userName.trim(),
        'fullName': req.body.fullName.trim(),
        'bio': req.body.bio.trim(),
        'emailId': req.body.emailId,
        'phoneNo': req.body.phoneNo.trim(),
        'displayPicture': req.body.displayPicture,
        'gender': req.body.gender,
        'folderName': folderName,
        'country_name': req.body.country_name,
        'ip':req.ip
    });

    user.save(function (err, user) {
        if (err) {
            console.log(err);
            res.status(404).send({
                success: false,
                user_id: null
            });
        } else {
            var ids = ["5b8e24da259b69583f6d861d","5ba08c48b20d1d7f87015899"];
            async.waterfall([
                function (callback) {
                    ids.forEach(function (id) {
                        var q = User.findOne({_id: id}, '_id userName fullName displayPicture fcmKey');
                        q.exec(function (err, userData) {
                            if (err){
                                res.status(404).send({
                                    success: false,
                                    user: null
                                });
                            }else{
                                var following = new Following({
                                    'userId': user._id,
                                    'followingFullName': userData.fullName,
                                    'followingUserName': userData.userName,
                                    'followingId': userData._id,
                                    'followingDisplayPicture': userData.displayPicture
                                });
                                following.save(function (err, data) {
                                    if (err) {
                                        res.send({
                                            success: false
                                        });
                                    }else{
                                        User.findOneAndUpdate({_id: user._id}, {
                                            $inc: {followingCount: 1}
                                        }, function (err, data) {
                                            if (err){
                                                res.send({
                                                    success: false
                                                });
                                            }else{
                                                var follower = new Follower({
                                                    'userId': userData._id,
                                                    'followerFullName': req.body.fullName,
                                                    'followerUserName': req.body.userName,
                                                    'followerId': user._id,
                                                    'followerDisplayPicture': req.body.displayPicture
                                                });
                                                follower.save(function (err) {
                                                    if (err) {
                                                        res.send({
                                                            success: false
                                                        });
                                                    }else{
                                                        User.findOneAndUpdate({_id: userData._id}, {
                                                            $inc: {followersCount: 1}
                                                        }, function (err) {
                                                            if (err){
                                                                res.send({
                                                                    success: false
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                    setTimeout(function () {
                        callback(null, ids);
                    }, 60);
                }
            ], function (err, result) {
                var token = jwt.sign(user, config.secret, {
                    expiresIn: '30d' // expires in 30 days, also change in "refresh token" endpoint
                });
                res.send({
                    success: true,
                    user_id: user,
                    token: token
                });
            });
        }
    });
});

/*router.post('/user/signup_user', function (req, res) {
    var folderName = shortid.generate();

    if(req.body.DeviceType != undefined && req.body.DeviceType != ''){
        var DeviceType = req.body.DeviceType;
        folderName = folderName+"_"+DeviceType;
    }
    var user = new User({
        'userName': req.body.userName.trim(),
        'fullName': req.body.fullName.trim(),
        'bio': req.body.bio.trim(),
        'emailId': req.body.emailId,
        'phoneNo': req.body.phoneNo.trim(),
        'displayPicture': req.body.displayPicture,
        'gender': req.body.gender,
        'folderName': folderName,
        'country_name': req.body.country_name,
        'ip':req.ip
    });

    user.save(function (err, user) {
        if (err) {
            res.status(404).send({
                success: false,
                user_id: null
            });
        } else {
            var q = User.findOne({_id: "58984bd203a2f3e861c1ff58"}, '_id userName fullName displayPicture fcmKey');
            q.exec(function (err, userData) {
                if (err){
                    res.status(404).send({
                        success: false,
                        user: null
                    });
                }else{
                    var following = new Following({
                        'userId': user._id,
                        'followingFullName': userData.fullName,
                        'followingUserName': userData.userName,
                        'followingId': userData._id,
                        'followingDisplayPicture': userData.displayPicture
                    });
                    following.save(function (err, data) {
                        if (err) {
                            res.send({
                                success: false
                            });
                        }else{
                            User.findOneAndUpdate({_id: user._id}, {
                                $inc: {followingCount: 1}
                            }, function (err, data) {
                                if (err){
                                    res.send({
                                        success: false
                                    });
                                }else{
                                    var follower = new Follower({
                                        'userId': userData._id,
                                        'followerFullName': req.body.fullName,
                                        'followerUserName': req.body.userName,
                                        'followerId': user._id,
                                        'followerDisplayPicture': req.body.displayPicture
                                    });
                                    follower.save(function (err) {
                                        if (err) {
                                            res.send({
                                                success: false
                                            });
                                        }else{
                                            User.findOneAndUpdate({_id: userData._id}, {
                                                $inc: {followersCount: 1}
                                            }, function (err) {
                                                if (err){
                                                    res.send({
                                                        success: false
                                                    });
                                                }else{
                                                    var token = jwt.sign(user, config.secret, {
                                                        expiresIn: '30d' // expires in 30 days, also change in "refresh token" endpoint
                                                    });
                                                    res.send({
                                                        success: true,
                                                        user_id: user,
                                                        token: token
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});*/

router.post('/user/iosUsers', function(req, res){
    var data = req.body.deviceType;
    var q = User.find({folderName:new RegExp(data, 'i')}, '_id userName fullName folderName');
    q.exec(function (err, userData) {
        if(err){
            res.status(404).send({
                success: false
            });
        }else{
            res.send({
                success: true,
                users: userData
            });
        }
    });
});

//logout
router.post('/user/logout', function (req, res) {
    User.update(
        { "_id": req.body.userId },
        { "fcmKey": '' },
        function(err, result) {
            if(err){
                res.send({
                    success: false
                });
            } else {
                res.send({
                    success: true
                });
            }
        }
    );
});

//sign in
router.post('/user/get_id', function (req, res) {
    User.findOne({"emailId": req.body.emailId}, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false,
                    user: null
                }
            );
        } else if (user) {
            var token = jwt.sign(user, config.secret, {
             expiresIn: '30d' // expires in 30 days, also change in "refresh token" endpoint
             });
            var geoip = require('geoip-lite');
            var ip = "207.97.227.239";
            var geo = geoip.lookup(ip);
            console.log(geo);

            var newLocation = new IpLocation({
                'userId': user._id, 
                'userFullName': user.fullName,
                'ip': ip,
                'range': geo.range,
                'country': geo.country,
                'region': geo.region,
                'city': geo.city,
                'll': geo.ll,
                'metro': geo.metro,
                'zip': geo.zip
            });
            IpLocation.findOneAndUpdate({userId: user._id}, {
                'userId': user._id, 
                'userFullName': user.fullName,
                'ip': ip,
                'range': geo.range,
                'country': geo.country,
                'region': geo.region,
                'city': geo.city,
                'll': geo.ll,
                'metro': geo.metro,
                'zip': geo.zip
            }, function (err, iplocation) {
                if (err) res.send({success: false, message: 'Something went wrong!', err: err});
                else if (iplocation == null) {
                    newLocation.save(function (err, newlocation) {
                        res.send({
                            success: true,
                            user: user,
                            token: token,
                            newlocation: newlocation
                        });
                    })
                }
                else {
                    res.send({ 
                        success: true,
                        user: user,
                        token: token,
                        iplocation: iplocation
                    });
                }
            });
        } else {
            res.status(200).send(
                {
                    success: false,
                    user: null
                }
            );
        }
    });
});

router.post('/user/refreshToken', function (req, res) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            console.log(err.message);
            return res.json({success: false, message: err.message});
        } else {
            var refreshed = jwt.refresh(decoded, '30d', config.secret);
            res.send({
                success: true,
                //oldToken: token,
                newToken: refreshed
            });
        }
    });
});




router.post('/post/add-post', function (req, res) {
    if (req.body.userId == "588c44c1af482344059a596d") {
        var q = User.findOne({_id: "588c44c1af482344059a596d"});
        q.exec(function (err, user) {
            if(user){
                var post = new Post({
                    'postImageUrl': req.body.postImageUrl,
                    'userId': req.body.userId,
                    'userName': user.userName,
                    'fullName': user.fullName,
                    'userDisplayPicture': user.displayPicture,
                    'caption': req.body.caption.trim(),
                    'height': req.body.height,
                    'width': req.body.width
                });
                post.save(function (err, post) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        var q = User.findOneAndUpdate({_id: req.body.userId}, {
                            $inc: {totalPostsCount: 1},
                            $set: {lastPostUploadedOn: post.date}
                        });
                        q.exec(function (err, done) {
                            if (err) {
                                res.status(404).send({
                                    success: false
                                });
                            } else {
                                res.send({
                                    success: true,
                                    lastId: post._id
                                });
                            }
                        });
                    }
                });
            }
        })
    } else {
        res.send({
            success: false
        });
    }
});


// router.use(function (req, res, next) {
//     var token = req.body.token || req.query.token || req.headers['x-access-token'];
//     if (token) {
//         jwt.verify(token, config.secret, function (err, decoded) {
//             if (err) {
//                 console.log(err.message);
//                 return res.json({success: false, message: err.message});
//             } else {
//                 req.decoded = decoded;
//                 next();
//             }
//         });
//     } else {
//         /*return res.send({
//             success: false,
//             message: 'No token provided.'
//         });*/
//         return res.send({
//             success: false,
//             message: 'jwt expired',
//             realmessage: "No token provided."
//         });
//     }
// });

router.post('/user/saveCountryFromIp', function (req, res) {
    where.is(req.ip, function(err, result) {
        if (result) {
            var country = new userCountry({
                'userId': req.body.userId.trim(),
                'userFullName': req.body.userFullName.trim(),
                'ip': req.ip,
                'city': result.get('city'),
                'region': result.get('region'),
                'regionCode': result.get('regionCode'),
                'zip': result.get('postalCode'),
                'country': result.get('country'),
                'countryCode': result.get('countryCode'),
                'latitude': result.get('lat'),
                'longitude': result.get('lng')
            });
            country.save(function (err, country) {
                if(err){
                    res.send({
                        success: false
                    })
                }else {
                    res.send({
                        success: true
                    })
                }
            })
        }
    });
});

router.post('/user/getCountriesFromIps', function (req, res) {
    userCountry.find({}, function (err, result) {
        if(err){
            res.send({
                success: false,
                result: null
            })
        }else{
            res.send({
                success: true,
                result: result
            })
        }
    })
})

router.post('/user/get_profile_info', function (req, res) {
    User.findById(req.body.id, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    user: null,
                    success: false
                }
            );
        } else if (user) {
            res.send(
                {
                    user: user,
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    user: null,
                    success: false
                }
            );
        }
    });
});

router.post('/user/deleteWorkInfo', function (req, res) {
    User.update(
        { "_id": req.body.userId },
        { "$pull": { "work": { "_id": req.body.workId } } },
        function(err, result) {
            if(err){
                res.send({
                    success: false
                });
            } else {
                res.send({
                    success: true
                });
            }
        }
    );
});

router.post('/user/updateEducationInfo', function (req, res) {
    User.findOneAndUpdate({ "_id": req.body.userId, "education._id": req.body.educationId },
        {
            "$set": {
                "education.$.organization" : req.body.organization.trim(),
                "education.$.country": req.body.country.trim(),
                "education.$.title": req.body.title.trim(),
                "education.$.city": req.body.city.trim(),
                "education.$.isPhysical": req.body.isPhysical,
                "education.$.from": req.body.from,
                "education.$.to": req.body.to,
                "education.$.isGraduated": req.body.isGraduated,
                "education.$.attendedFor": req.body.attendedFor.trim()
            }
        },
        function(err,doc) {
            if (err) {
                res.status(404).send(
                    {
                        success: false
                    }
                );
            } else if (doc) {

                res.send(
                    {
                        success: true
                    }
                );
            } else {
                res.status(200).send(
                    {
                        success: false

                    }
                );
            }
        }
    );
});
router.post('/user/deleteEducationInfo', function (req, res) {
    User.update(
        { "_id": req.body.userId },
        { "$pull": { "education": { "_id": req.body.educationId } } },
        function(err, result) {
            if(err){
                res.send({
                    success: false
                });
            } else {
                res.send({
                    success: true
                });
            }
        }
    );
});
router.post('/user/deleteField', function (req, res) {
    User.update({_id: req.body.userId}, {$unset: {work: 1 }}, function (err, result) {
        if(err){
            res.send(
                {
                    success: false
                }
            );
        }else{
            res.send(
                {
                    success: true
                }
            );
        }
    });
});
router.post('/user/addPlacesLived', function (req, res) {

    var query = {'_id': req.body.userId};
    var places = new Object({
        city: req.body.city.trim(),
        country: req.body.country.trim(),
        address: req.body.address.trim(),
        from: req.body.from,
        to: req.body.to.trim(),
        isCurrentlyLiving: req.body.isCurrentlyLiving
    });

    User.findOneAndUpdate(query, {
        $push: {places: places}
    }, function (err, places) {
        if (err) {
            console.log(err);
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (places) {
            var q = User.findOne(query);
            q.exec(function (err, result) {
                if(err){
                    res.send(
                        {
                            success: false
                        }
                    );
                }else {
                    var count = result.places.length;
                    lastId = result.places[count-1]._id;
                    res.send(
                        {
                            success: true,
                            lastId:lastId
                        }
                    );
                }
            });
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });
});
router.post('/user/updatePlacesLived', function (req, res) {
    User.findOneAndUpdate({ "_id": req.body.userId, "places._id": req.body.placeId },
        {
            "$set": {
                "places.$.city" : req.body.city.trim(),
                "places.$.country": req.body.country.trim(),
                "places.$.address": req.body.address.trim(),
                "places.$.from": req.body.from.trim(),
                "places.$.to": req.body.to,
                "places.$.isCurrentlyLiving": req.body.isCurrentlyLiving
            }
        },
        function(err,doc) {
            if (err) {
                res.status(404).send(
                    {
                        success: false
                    }
                );
            } else if (doc) {

                res.send(
                    {
                        success: true
                    }
                );
            } else {
                res.status(200).send(
                    {
                        success: false

                    }
                );
            }
        }
    );
});
router.post('/user/deletePlacesInfo', function (req, res) {
    User.update(
        { "_id": req.body.userId },
        { "$pull": { "places": { "_id": req.body.placeId } } },
        function(err) {
            if(err){
                res.send({
                    success: false
                });
            } else {
                res.send({
                    success: true
                });
            }
        }
    );
});
router.post('/user/deletePlacesField', function (req, res) {
    User.update({_id: req.body.userId}, {$unset: {places: 1 }}, function (err) {
        if(err){
            res.send(
                {
                    success: false
                }
            );
        }else{
            res.send(
                {
                    success: true
                }
            );
        }
    });
});
router.post('/user/updateProfessionalSkills', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'professionalSkills': req.body.professionalSkills.trim(),
        'isProfessionalSkillsPrivate': req.body.isProfessionalSkillsPrivate
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {

            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false

                }
            );
        }
    });
});

router.post('/user/updateRelationshipInfo', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'maritalStatus': req.body.maritalStatus,
        'isMaritalStatusPrivate': req.body.isMaritalStatusPrivate
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {

            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false

                }
            );
        }
    });
});
router.post('/user/updateContactInfo', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'emailId': req.body.emailId.trim(),
        'phoneNo': req.body.phoneNo.trim(),
        'web': req.body.web.trim(),
        'isPhoneNoPrivate': req.body.isPhoneNoPrivate,
        'isWebPrivate': req.body.isWebPrivate,
        'isEmailPrivate': req.body.isEmailPrivate
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {

            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false

                }
            );
        }
    });
});
router.post('/user/updateBioInfo', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'bio': req.body.bio.trim()
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {

            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false

                }
            );
        }
    });
});
router.post('/user/addEducationInfo', function (req, res) {
    var query = {'_id': req.body.userId};
    var education = new Object({
        organization : req.body.organization.trim(),
        country: req.body.country.trim(),
        title: req.body.title.trim(),
        city: req.body.city.trim(),
        isPhysical: req.body.isPhysical,
        from: req.body.from,
        to: req.body.to,
        isGraduated: req.body.isGraduated,
        attendedFor: req.body.attendedFor
    });

    User.findOneAndUpdate(query, {
        $push: {education: education}
    }, function (err, education) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (education) {
            var q = User.findOne(query);
            q.exec(function (err, result) {
                if(err){
                    res.send(
                        {
                            success: false
                        }
                    );
                }else {
                    var count = result.education.length;
                    lastId = result.education[count-1]._id;
                    res.send(
                        {
                            success: true,
                            lastId:lastId
                        }
                    );
                }
            });
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });
});
router.post('/user/deleteEducationField', function (req, res) {
    User.update({_id: req.body.userId}, {$unset: {education: 1 }}, function (err, result) {
        if(err){
            res.send(
                {
                    success: false
                }
            );
        }else{
            res.send(
                {
                    success: true
                }
            );
        }
    });
});
router.post('/user/addWorkInfo', function (req, res) {

    var query = {'_id': req.body.userId};
    var work = new Object({
        organization: req.body.organization.trim(),
        country: req.body.country.trim(),
        position: req.body.position.trim(),
        city: req.body.city.trim(),
        isPhysical: req.body.isPhysical,
        description: req.body.description.trim(),
        from: req.body.from.trim(),
        to: req.body.to.trim(),
        isCurrentlyWorking: req.body.isCurrentlyWorking
    });

    User.findOneAndUpdate(query, {
        $push: {work: work}
    }, function (err, result) {
        if (err) {
            res.send(
                {
                    success: false,
                    error: err
                }
            );
        } else {
            var q = User.findOne(query);
            q.exec(function (err, result) {
                if(err){
                    res.send(
                        {
                            success: false
                        }
                    );
                }else {
                    var count = result.work.length;
                    lastId = result.work[count-1]._id;
                    res.send(
                        {
                            success: true,
                            lastId:lastId
                        }
                    );
                }
            });
        }
    });
});
router.post('/user/updateWorkInfo', function (req, res) {
    User.findOneAndUpdate({ "_id": req.body.userId, "work._id": req.body.workId },
        {
            "$set": {
                "work.$.organization": req.body.organization.trim(),
                "work.$.country": req.body.country.trim(),
                "work.$.position": req.body.position.trim(),
                "work.$.city": req.body.city.trim(),
                "work.$.isPhysical": req.body.isPhysical,
                "work.$.description": req.body.description.trim(),
                "work.$.from": req.body.from.trim(),
                "work.$.to": req.body.to.trim(),
                "work.$.isCurrentlyWorking": req.body.isCurrentlyWorking
            }
        },
        function(err,doc) {
            if (err) {
                res.status(404).send(
                    {
                        success: false
                    }
                );
            } else if (doc) {

                res.send(
                    {
                        success: true
                    }
                );
            } else {
                res.status(200).send(
                    {
                        success: false

                    }
                );
            }
        }
    );
});

router.post('/user/updateUserInfo', function (req, res) {

    var query = {'_id': req.body.userId};

    var user = new Object({
        'fullName': req.body.fullName.trim(),
        'gender': req.body.gender,
        'dob': req.body.dob,
        'isGenderPrivate': req.body.isGenderPrivate,
        'religiousViews': req.body.religiousViews.trim(),
        'politicalViews': req.body.politicalViews.trim(),
        'languages': req.body.languages.trim(),
        'isDobPrivate': req.body.isDobPrivate
        /*'userName': req.body.userName.trim(),*/
        /*'phoneNo': req.body.phoneNo.trim(),*/
    });

    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {
            if(user.fullName != req.body.fullName.trim()){
                console.log("User"+user.fullName);
                console.log("Body"+req.body.fullName);

                var conditions = {userId: req.body.userId}
                    , update = {fullName: req.body.fullName}
                    , options = {multi: true};

                var conditions_following = {followingId: req.body.userId}
                    , update_following = {followingFullName: req.body.fullName};

                var conditions_follower = {followerId: req.body.userId}
                    , update_follower = {followerFullName: req.body.fullName};

                var conditions_latestComments = {latestComments: {$elemMatch: {userId: req.body.userId}}}
                    , update_latestComments = {"latestComments.$.fullName": req.body.fullName};


                Post.update(conditions, update, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("posts");
                    }
                });
                Like.update(conditions, update, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("like");
                    }
                });
                Follower.update(conditions_follower, update_follower, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("follower");
                    }
                });
                Following.update(conditions_following, update_following, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("following");
                    }
                });
                Comment.update(conditions, update, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("comment");
                    }
                });
                Post.update(conditions_latestComments, update_latestComments, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("latest_comments");
                    }
                });
            }
            res.send({
                success: true
            });
        } else {
            res.status(200).send(
                {
                    success: false

                }
            );
        }
    });
});

router.post('/user/deleteNotificationsField', function (req, res, next) {
    User.update({}, {$unset: {notifications: 1 }}, {multi: true}, function (err, result) {
        if(err){
            res.send(
                {
                    success: false
                }
            );
        }else{
            res.send(
                {
                    success: true
                }
            );
        }
    });
});

router.post('/user/notification', function (req, res, next) {
    if (req.body.lastId == "0") {
        var q = Notification.find({myId:req.body.myId}).limit(20).sort({_id: -1});
        q.lean().exec(function (err, result) {
            if (err) {
                res.status(404).send({
                    success: false,
                    notification: null
                });
            } else {
                async.waterfall([
                    function (callback) {
                        result.forEach(function (user) {
                            var q = Follower.findOne({userId: user.userId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;
                                } else {
                                    user.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, result);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send({
                        success: true,
                        notification: result
                    });
                });
            }
        });
    } else {
        var q = Notification.find({myId: req.body.myId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(20);
        q.lean().exec(function (err, result) {
            if (err) {
                res.status(404).send({
                    success: false,
                    notification: null
                });
            } else {
                async.waterfall([
                    function (callback) {
                        result.forEach(function (user) {
                            var q = Follower.findOne({userId: user.userId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;
                                } else {
                                    user.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, result);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send({
                        success: true,
                        notification: result
                    });
                });
            }
        });
    }
});

// search user with score
/*router.post('/user/searchUserWithScore',function (req,res) {
    var searchText = req.body.keyword;
    var skip = parseInt(req.body.skip);
    var regex = new RegExp(searchText, 'i'); // 'i' makes it case insensitive

    var q = User.find(
        {$text: {$search: searchText}},
        {score: {$meta: "textScore"}}
    ).sort({score: {$meta: "textScore"}}).select({
        "fullName": 1,
        "_id": 1,
        "userName": 1,
        "followersCount": 1,
        "displayPicture": 1
    }).limit(20).skip(skip);
    q.lean().exec(function (err, users) {
        if (err) {
            res.status(404).send(
                {
                    success: false,
                    users: null
                }
            );
        } else {
            async.waterfall([
                function (callback) {
                    users.forEach(function (user) {
                        var q = Follower.findOne({userId: user._id, followerId: req.body.myId});
                        q.lean().exec(function (err, data) {
                            if (data) {
                                user.isFollowed = true;

                            } else {
                                user.isFollowed = false;
                            }
                        });

                        var q1 = BlockUser.findOne({userId: user._id, blockedBy: req.body.myId});
                        q1.lean().exec(function (err, data) {
                            if (data) {
                                user.isBlocked = true;

                            } else {
                                user.isBlocked = false;
                            }
                        });
                    });
                    setTimeout(function () {
                        callback(null, users);
                    }, 60);
                }
            ], function (err, result) {
                res.send(
                    {
                        success: true,
                        users: result
                    }
                );
            });
        }
    });
});*/

router.post('/user/search_user',function (req,res) {
    var lastId;
    var myId = req.body.myId;

    var searchText = req.body.keyword;
    var regex = new RegExp(searchText, 'i'); // 'i' makes it case insensitive
    if (req.body.lastId == "0") {
        var q = User.find({fullName: regex}).select({
            "fullName": 1,
            "_id": 1,
            "userName": 1,
            "followersCount": 1,
            "displayPicture": 1
        }).limit(20).sort({_id: 1});
        q.lean().exec(function (err, users_regex) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        users: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        users_regex.forEach(function (user) {
                            var q = Follower.findOne({userId: user._id, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;

                                } else {
                                    user.isFollowed = false;
                                }
                            });

                            var q1 = BlockUser.findOne({userId: user._id, blockedBy: req.body.myId});
                            q1.lean().exec(function (err, data) {
                                if (data) {
                                    user.isBlocked = true;

                                } else {
                                    user.isBlocked = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, users_regex);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            users: result
                        }
                    );
                });
            }
        });
    } else {
        var q = User.find({_id: {'$gt': req.body.lastId}, fullName: regex}).select({
            "fullName": 1,
            "_id": 1,
            "userName": 1,
            "followersCount": 1,
            "displayPicture": 1
        }).limit(20).sort({_id: 1});
        q.lean().exec(function (err, users_regex) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        users: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        users_regex.forEach(function (user) {
                            var q = Follower.findOne({userId: user._id, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;

                                } else {
                                    user.isFollowed = false;
                                }
                            });

                            var q1 = BlockUser.findOne({userId: user._id, blockedBy: req.body.myId});
                            q1.lean().exec(function (err, data) {
                                if (data) {
                                    user.isBlocked = true;

                                } else {
                                    user.isBlocked = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, users_regex);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            users: result
                        }
                    );
                });
            }
        });
    }
});

router.post('/user/get_user_profile_info', function (req, res) {
    var q = User.findById(req.body.userId);
    q.lean().exec(function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    user: null,
                    success: false
                }
            );
        } else if (user) {
            async.waterfall([
                function (callback) {
                    var q = Follower.findOne({userId: req.body.userId, followerId: req.body.myId});
                    q.lean().exec(function (err, data) {
                        if (data) {
                            user.isFollowed = true;
                        } else {
                            user.isFollowed = false;
                        }
                    });
                    setTimeout(function () {
                        callback(null, user);
                    }, 60);

                }
            ], function (err, result) {
                res.send(
                    {
                        success: true,
                        user: result
                    }
                );
            });
        } else {
            res.status(200).send(
                {
                    user: null,
                    success: false
                }
            );
        }
    });
});

router.post('/user/getUserInfo', function (req, res) {
    if(req.body.lastId == "0"){
        var q = User.findById(req.body.userId).select({
            "_id": 1,
            "fullName": 1,
            "userName": 1,
            "bio": 1,
            "displayPicture": 1,
            "totalPostsCount":1,
            "followersCount":1,
            "followingCount":1,
            "fullDisplayPicture":1,
            "backCoverDisplayPicture":1
        });
        q.lean().exec(function (err, user) {
            if(err){
                res.status(404).send({
                    success: false,
                    user: null
                })
            }else{
                async.waterfall([
                    function (callback) {
                        var q = Follower.findOne({userId: req.body.userId, followerId: req.body.myId});
                        q.lean().exec(function (err, data) {
                            if (data) {
                                user.isFollowed = true;
                            } else {
                                user.isFollowed = false;
                            }
                        });
                        setTimeout(function () {
                            callback(null, user);
                        }, 60);
                    }
                ], function (err, result) {
                    var q = Post.find({userId: req.body.userId}).sort({_id: -1}).limit(10);
                    q.lean().exec(function (err, posts) {
                        if(err){
                            res.status(404).send({
                                success: false,
                                posts: null
                            })
                        } else{
                            async.waterfall([
                                function (callback) {
                                    posts.forEach(function (post) {
                                        var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                        q.lean().exec(function (err, data) {
                                            if (data) {
                                                post.isLiked = true;
                                            } else {
                                                post.isLiked = false;
                                            }
                                        });
                                    });
                                    setTimeout(function () {
                                        callback(null, posts);
                                    }, 60);
                                }
                            ], function (err, result) {
                                res.send({
                                    success: true,
                                    user: user,
                                    posts: posts
                                });
                            });
                        }
                    });
                });
            }
        })
    }else{
        var q = Post.find({userId: req.body.userId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if(err){
                res.status(404).send({
                    success: false,
                    posts: null
                })
            } else{
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                } else {
                                    post.isLiked = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send({
                        success: true,
                        posts: posts
                    });
                });
            }
        });
    }
});

router.post('/user/getMyInfo', function (req, res) {
    if(req.body.lastId == "0"){
        var q = User.findById(req.body.myId).select({
            "_id": 1,
            "fullName": 1,
            "userName": 1,
            "bio": 1,
            "displayPicture": 1,
            "totalPostsCount":1,
            "followersCount":1,
            "followingCount":1,
            "fullDisplayPicture":1,
            "backCoverDisplayPicture":1
        });
        q.lean().exec(function (err, user) {
            if(err){
                res.status(404).send({
                    success: false,
                    user: null
                })
            }else{
                var q = Post.find({userId: req.body.myId}).sort({_id: -1}).limit(10);
                q.lean().exec(function (err, posts) {
                    if(err){
                        res.status(404).send({
                            success: false,
                            posts: null
                        })
                    } else{
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            res.send({
                                success: true,
                                user: user,
                                posts: posts
                            });
                        });
                    }
                });
            }
        })
    }else{
        var q = Post.find({userId: req.body.myId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if(err){
                res.status(404).send({
                    success: false,
                    posts: null
                })
            } else{
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                } else {
                                    post.isLiked = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send({
                        success: true,
                        posts: posts
                    });
                });
            }
        });
    }
});

router.post('/user/get_user_info_plus_notify', function (req, res) {
    var q = User.findById(req.body.userId);
    q.lean().exec(function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    user: null,
                    success: false
                }
            );
        } else if (user) {
            async.waterfall([
                function (callback) {
                    var q = Follower.findOne({userId: req.body.userId, followerId: req.body.myId});
                    q.lean().exec(function (err, data) {
                        if (data) {
                            user.isFollowed = true;
                        } else {
                            user.isFollowed = false;
                        }
                    });
                    setTimeout(function () {
                        callback(null, user);
                    }, 60);

                }
            ], function (err, result) {
                Notification.findByIdAndUpdate(req.body.notifyId, {status: 'read'}, function (err, notify) {
                    if (err) {
                        res.send({
                            success: false
                        });
                    } else {
                        res.send({
                            success: true,
                            user: result
                        });
                    }
                });
            });

        } else {
            res.status(200).send(
                {
                    user: null,
                    success: false
                }
            );
        }
    });
});
router.post('/user/update_profile_info', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'userName': req.body.userName.trim(),
        'fullName': req.body.fullName.trim(),
        'bio': req.body.bio.trim(),
        'phoneNo': req.body.phoneNo.trim(),
        'isPhoneNoPrivate': req.body.isPhoneNoPrivate,
        'gender': req.body.gender,
        'isGenderPrivate': req.body.isGenderPrivate,
        'work': req.body.work,
        'isWorkPrivate': req.body.isWorkPrivate,
        'country': req.body.country,
        'isCountryPrivate': req.body.isCountryPrivate,
        'dob': req.body.dob,
        'isDobPrivate': req.body.isDobPrivate,
        'maritalStatus': req.body.maritalStatus,
        'isMaritalStatusPrivate': req.body.isMaritalStatusPrivate
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {

            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });


    var conditions = {userId: req.body.userId}
        , update = {fullName: req.body.fullName, userName: req.body.userName}
        , options = {multi: true};

    var conditions_following = {followingId: req.body.userId}
        , update_following = {followingFullName: req.body.fullName, followingUserName: req.body.userName};

    var conditions_follower = {followerId: req.body.userId}
        , update_follower = {followerFullName: req.body.fullName, followerUserName: req.body.userName};

    var conditions_latestComments = {latestComments: {$elemMatch: {userId: req.body.userId}}}
        , update_latestComments = {"latestComments.$.fullName": req.body.fullName};


    Post.update(conditions, update, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("posts");
        }
    });
    Like.update(conditions, update, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("like");
        }
    });
    Follower.update(conditions_follower, update_follower, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("follower");
        }
    });
    Following.update(conditions_following, update_following, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("following");
        }
    });
    Comment.update(conditions, update, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("comment");
        }
    });
    Post.update(conditions_latestComments, update_latestComments, options, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("latest_comments");
        }
    });
});

//update fcm key
router.post('/user/update_fcm_key', function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'fcmKey': req.body.fcmKey
    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {
            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });
});

//follow
router.post('/user/follow', function (req, res) {
    if(req.body.followId != req.body.userId){
        async.waterfall([
            function (getFollowingDataCallback) {
                var q = User.findOne({_id: req.body.followId}, '_id userName fullName displayPicture fcmKey');
                q.exec(function (err, userData) {
                    if (err){
                        getFollowingDataCallback(err);
                    }else{
                        getFollowingDataCallback(null, userData);
                    }
                });
            },
            function (userData, saveFollowingCallback) {
                var following = new Following({
                    'userId': req.body.userId,
                    'followingFullName': userData.fullName,
                    'followingUserName': userData.userName,
                    'followingId': req.body.followId,
                    'followingDisplayPicture': userData.displayPicture
                });
                following.save(function (err, data) {
                    if (err) {
                        saveFollowingCallback(err);
                    }else{
                        saveFollowingCallback(null, userData);
                    }
                });
            },
            function (userData, incrementFollowingCallback) {
                User.findOneAndUpdate({_id: req.body.userId}, {
                    $inc: {followingCount: 1}
                }, function (err, data) {
                    if (err){
                        incrementFollowingCallback(err);
                    }else{
                        incrementFollowingCallback(null, userData);
                    }
                });
            },
            function (userData, saveFollowerCallback) {
                var follower = new Follower({
                    'userId': req.body.followId,
                    'followerFullName': req.body.fullName,
                    'followerUserName': req.body.userName,
                    'followerId': req.body.userId,
                    'followerDisplayPicture': req.body.displayPicture
                });
                follower.save(function (err) {
                    if (err) {
                        saveFollowerCallback(err);
                    }else{
                        saveFollowerCallback(null, userData);
                    }
                });
            },
            function (userData, incrementFollowerCallback) {
                User.findOneAndUpdate({_id: req.body.followId}, {
                    $inc: {followersCount: 1}
                }, function (err) {
                    if (err){
                        incrementFollowerCallback(err);
                    }else{
                        incrementFollowerCallback(null, userData);
                    }
                });
            },
            function (userData, getFollowerDataCallback) {
                var q = User.findOne({_id: req.body.userId}, '_id userName fullName displayPicture fcmKey');
                q.exec(function (err, userData1) {
                    if (err){
                        getFollowerDataCallback(err);
                    }else{
                        getFollowerDataCallback(null, userData1, userData);
                    }
                });
            },
            function (userData1, userData, saveNotificationCallback) {
                var notification = new Notification({
                    'myId':req.body.followId,
                    'fullName': userData1.fullName,
                    'userName': userData1.userName,
                    'userId': req.body.userId,
                    'userDisplayPicture':  userData1.displayPicture,
                    'notification_type':'follow',
                    'status':'unread'
                });
                notification.save(function (err, data) {
                    if (err){
                        saveNotificationCallback(err);
                    }else{
                        saveNotificationCallback(null, userData);
                    }
                });
            },
            function (userData, sendNotificationCallback) {
                if (userData.fcmKey != "0" && userData.fcmKey != "" && userData.fcmKey != undefined) {
                    //console.log('fcmkey'+userData.fcmKey);
                    var serverKey = 'AIzaSyBdwE3KIKwR50d4NziJPJDsTdL_TrWXlE0';
                    var fcm = new FCM(serverKey);
                    var message = {
                        to: userData.fcmKey,
                        collapse_key: 'test',
                        data: {
                            your_custom_data_key: 'follow',
                            userId: req.body.userId,
                            fullName: req.body.fullName,
                            profilePicture: req.body.displayPicture,
                            date:  new Date()
                        }
                    };
                    fcm.send(message)
                        .then(function(response){
                            console.log("Successfully sent with response: ", response);
                            /*res.send({
                             success: true
                             });*/
                        })
                        .catch(function(err){
                            console.log("Something has gone wrong! Follow");
                            console.error(err);
                            /*res.send({
                             success: false
                             });*/
                        })
                }
                sendNotificationCallback(null, 'done');
            }
        ], function (err, result) {
            if(err){
                res.send({
                    success: false
                });
            }else{
                res.send({
                    success: true
                });
            }
        });
    }else{
        res.send({
            success: false
        });
    }
});

//approve request
router.post('/user/approve_request', function(req, res){
    var accepted = req.body.accepted;
    var myId = req.body.myId;
    var userId = req.body.userId;

    if(accepted == "1"){
        Follower.update({userId:myId, followerId:userId}, {followedStatus:"approved"}, function (err) {
            if(err){
                res.status(404).send({
                    success: false
                });
            }else{
                User.findOneAndUpdate({_id: userId}, {
                    $inc: {followersCount: 1}
                }, function (err) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        Following.update({userId:userId, followingId:myId}, {followedStatus:"approved"}, function (err) {
                            if(err){
                                res.status(404).send({
                                    success: false
                                });
                            }else{
                                User.findOneAndUpdate({_id: myId}, {
                                    $inc: {followingCount: 1}
                                }, function (err) {
                                    if (err) {
                                        res.status(404).send({
                                            success: false
                                        });
                                    } else {
                                        res.send({
                                            success: true
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }else{
        Follower.find({userId:myId, followerId:userId}).remove(function (err) {
            if(err){
                res.status(404).send({
                    success: false
                });
            }else{
                Following.find({userId:userId, followingId:myId}).remove(function (err) {
                    if(err){
                        res.status(404).send({
                            success: false
                        });
                    }else{
                        res.send({
                            success: true
                        });
                    }
                });
            }
        });
    }
});

//block user
router.post('/user/blockUser', function(req, res){
    var email = req.body.email;
    var block = new BlockUser({
        email: email
    });
    block.save(function (err, user) {
        if (err) res.send({success: false, message: 'User blocked failed'});
        else res.send({success: true, message: 'User blocked successfully'});
    });
});

//Unblock user
router.post('/user/unblockUser', function(req, res){
    var myId = req.body.myId; //the person who will block
    var userId = req.body.userId; //the person who will be blocked

    BlockUser.find({userId:userId, blockedBy:myId}).remove(function (err) {
        if(err){
            res.status(404).send({
                success: false
            });
        }else{
            res.send({
                success: true
            });
        }
    });
});

//Notification count
router.post('/user/getNotificationsCount', function (req, res) {
    var userId = req.body.userId;
    NotifyCount.findOne({userId:userId}, function (err, count) {
        if(err){
            res.status(404).send({
                success: false,
                count: null
            })
        }else {
            res.send(
                {
                    success: true,
                    count: count
                }
            );
        }
    });
});

router.post('/user/resetNotificationsCount', function (req, res) {
    var userId = req.body.userId;
    NotifyCount.findOneAndUpdate({userId: userId}, {
        $set: {total: 0}
    }, function (err) {
        //console.log(err);
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

router.post('/user/get_my_followers', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Follower.find({userId: req.body.myId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followers) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followers: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followers.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followerId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });

                        });
                        setTimeout(function () {
                            callback(null, followers);
                        }, 60);
                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followers: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Follower.find({userId: req.body.myId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followers) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followers: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followers.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followerId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });

                        });
                        setTimeout(function () {
                            callback(null, followers);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followers: result
                        }
                    );
                });
            }
        });
    }
});
router.post('/user/get_my_following', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Following.find({userId: req.body.myId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followings) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followings: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        followings: followings
                    }
                );
            }
        });
    } else {
        var q = Following.find({userId: req.body.myId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followings) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followings: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        followings: followings
                    }
                );
            }
        });
    }
});
router.post('/user/get_user_followers', function (req, res) {
    if (req.body.lastId == "0") {

        var q = Follower.find({userId: req.body.userId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followers) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followers: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followers.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followerId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, followers);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followers: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Follower.find({userId: req.body.userId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followers) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followers: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followers.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followerId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, followers);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followers: result
                        }
                    );
                });
            }
        });
    }

});
router.post('/user/get_user_following', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Following.find({userId: req.body.userId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followings) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followings: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followings.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followingId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, followings);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followings: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Following.find({userId: req.body.userId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, followings) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        followings: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        followings.forEach(function (follower) {
                            var q = Follower.findOne({userId: follower.followingId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    follower.isFollowed = true;

                                } else {
                                    follower.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, followings);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            followings: result
                        }
                    );
                });
            }
        });
    }

});

//unfollow
router.post('/user/unfollow', function (req, res) {
    Follower.where({userId: req.body.userId, followerId: req.body.myId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            User.findOneAndUpdate({_id: req.body.userId}, {$inc: {followersCount: -1}}, function (err) {
                if (err) {
                    res.status(404).send(
                        {
                            success: false
                        }
                    );
                } else {
                    Following.where({
                        userId: req.body.myId,
                        followingId: req.body.userId
                    }).findOneAndRemove(function (err, data) {
                        if (err) {
                            res.status(404).send({
                                success: false
                            });
                        } else if (data) {
                            User.findOneAndUpdate({_id: req.body.myId}, {$inc: {followingCount: -1}}, function (err) {
                                if (err) {
                                    res.status(404).send(
                                        {
                                            success: false
                                        }
                                    );
                                } else {
                                    res.send(
                                        {
                                            success: true
                                        }
                                    );
                                }
                            });
                        } else {
                            res.status(404).send({
                                success: false
                            });
                        }
                    });
                }
            });
        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});

// posts without local ad
// router.post('/post/getFollowingPosts', function (req, res) {
//     console.log('called');
//     var q = Following.find({userId: req.body.myId}, 'followingId');
//     q.lean().exec(function (err, following) {
//         if (err) {
//             res.send({
//                 success: false
//             });
//         } else {
//             var ids = following.map(function (item) {
//                 return item['followingId'];
//             });
//             ids.push(req.body.myId);
//             var limit = 10;
//             var sort = {_id: -1};
//             var project = {
//                 "postImageUrl": 1,
//                 "postVideoUrl": 1,
//                 "userId": 1,
//                 "userName": 1,
//                 "fullName": 1,
//                 "height": 1,
//                 "width": 1,
//                 "userDisplayPicture": 1,
//                 "date": 1,
//                 "location": 1,
//                 "tags": 1,
//                 "caption": 1,
//                 "likes": 1,
//                 "comments": 1,
//                 "latestComments": 1
//             };
//             if (req.body.lastId == "0") {
//                 var query = {userId: {
//                     '$in': ids
//                 }};
//                 Post.aggregate([
//                     {"$match": query},
//                     {"$sort": sort},
//                     {"$limit": limit},
//                     {"$project": project}
//                 ], function (err, posts) {
//                     if (err) {
//                         res.status(404).send({
//                             success: false,
//                             posts: null
//                         });
//                     } else {
//                         async.waterfall([
//                             function (callback) {
//                                 posts.forEach(function (post) {
//                                     var q = Like.findOne({postId: post._id, userId: req.body.myId});
//                                     q.lean().exec(function (err, data) {
//                                         if (data) {
//                                             post.isLiked = true;
//                                         } else {
//                                             post.isLiked = false;
//                                         }
//                                     });
//                                 });
//                                 setTimeout(function () {
//                                     callback(null, posts);
//                                 }, 60);
//                             }
//                         ], function (err, result) {
//                             // Post.findOne({_id: '5b72cc73fae6c554a0290927'}, function (err, adPost) {
//                             //     var clone = Object.assign({}, adPost);
//                             //     delete clone._doc._id;
//                             //     console.log(clone._doc);
//                             //     clone._doc._id = Date.now().toString();
//                             //     result.unshift(clone._doc);
//                             //     console.log(result.length);
//                             //     res.send({
//                             //         success: true,
//                             //         posts: result
//                             //     });
//                             // });
//                             res.send({
//                                 success: true,
//                                 posts: result
//                             });
//                         });
//                     }
//                 });
//             }else{
//                 var query = {userId: {
//                     '$in': ids
//                 }, _id: {'$lt': mongoose.Types.ObjectId(req.body.lastId)}};
//                 Post.aggregate([
//                     {"$match": query},
//                     {"$sort": sort},
//                     {"$limit": limit},
//                     {"$project": project}
//                 ], function (err, posts) {
//                     if (err) {
//                         res.status(404).send({
//                             success: false,
//                             posts: null
//                         });
//                     } else {
//                         async.waterfall([
//                             function (callback) {
//                                 posts.forEach(function (post) {
//                                     var q = Like.findOne({postId: post._id, userId: req.body.myId});
//                                     q.lean().exec(function (err, data) {
//                                         if (data) {
//                                             post.isLiked = true;
//                                         } else {
//                                             post.isLiked = false;
//                                         }
//                                     });
//                                 });
//                                 setTimeout(function () {
//                                     callback(null, posts);
//                                 }, 60);
//                             }
//                         ], function (err, result) {
//                             // Post.findOne({_id: '5b72cc73fae6c554a0290927'}, function (err, adPost) {
//                             //     var clone = Object.assign({}, adPost);
//                             //     delete clone._doc._id;
//                             //     console.log(clone._doc);
//                             //     clone._doc._id = Date.now().toString();
//                             //     result.unshift(clone._doc);
//                             //     console.log(result.length);
//                             //     res.send({
//                             //         success: true,
//                             //         posts: result
//                             //     });
//                             // });
//                             res.send({
//                                 success: true,
//                                 posts: result
//                             });
//                         });
//                     }
//                 });
//             }
//         }
//     });
// });

// posts without local ad
// router.post('/post/getNotFollowingPosts', function (req, res) {
//     var q = Following.find({userId: req.body.myId}, 'followingId');
//     q.lean().exec(function (err, following) {
//         if (err) {
//             res.send({
//                 success: false
//             });
//         } else {
//             var ids = following.map(function (item)  {
//                 return item['followingId'];
//             });
//             ids.push(req.body.myId);
//             var limit = 10;
//             var sort = {_id: -1};
//             var project = {
//                 "postImageUrl": 1,
//                 "postVideoUrl": 1,
//                 "userId": 1,
//                 "userName": 1,
//                 "fullName": 1,
//                 "height": 1,
//                 "width": 1,
//                 "userDisplayPicture": 1,
//                 "date": 1,
//                 "location": 1,
//                 "tags": 1,
//                 "caption": 1,
//                 "likes": 1,
//                 "comments": 1,
//                 "latestComments": 1
//             };
//             if (req.body.lastId == "0") {
//                 var query = {userId: {
//                     '$nin': ids
//                 }};
//                 Post.aggregate([
//                     {"$match": query},
//                     {"$sort": sort},
//                     {"$limit": limit},
//                     {"$project": project}
//                 ], function (err, posts) {
//                     if (err) {
//                         res.status(404).send({
//                             success: false,
//                             posts: null
//                         });
//                     } else {
//                         async.waterfall([
//                             function (callback) {
//                                 posts.forEach(function (post) {
//                                     var q = Like.findOne({postId: post._id, userId: req.body.myId});
//                                     q.lean().exec(function (err, data) {
//                                         if (data) {
//                                             post.isLiked = true;
//                                         } else {
//                                             post.isLiked = false;
//                                         }
//                                     });
//                                 });
//                                 setTimeout(function () {
//                                     callback(null, posts);
//                                 }, 60);
//                             }
//                         ], function (err, result) {
//                             // Post.findOne({_id: '5b72cc73fae6c554a0290927'}, function (err, adPost) {
//                             //     var clone = Object.assign({}, adPost);
//                             //     delete clone._doc._id;
//                             //     console.log(clone._doc);
//                             //     clone._doc._id = Date.now().toString();
//                             //     result.unshift(clone._doc);
//                             //     console.log(result.length);
//                             //     res.send({
//                             //         success: true,
//                             //         posts: result
//                             //     });
//                             // });
//                             res.send({
//                                 success: true,
//                                 posts: result
//                             });
//                         });
//                     }
//                 });
//             }else{
//                 var query = {userId: {
//                     '$nin': ids
//                 }, _id: {'$lt': mongoose.Types.ObjectId(req.body.lastId)}};
//                 Post.aggregate([
//                     {"$match": query},
//                     {"$sort": sort},
//                     {"$limit": limit},
//                     {"$project": project}
//                 ], function (err, posts) {
//                     if (err) {
//                         res.status(404).send({
//                             success: false,
//                             posts: null
//                         });
//                     } else {
//                         async.waterfall([
//                             function (callback) {
//                                 posts.forEach(function (post) {
//                                     var q = Like.findOne({postId: post._id, userId: req.body.myId});
//                                     q.lean().exec(function (err, data) {
//                                         if (data) {
//                                             post.isLiked = true;
//                                         } else {
//                                             post.isLiked = false;
//                                         }
//                                     });
//                                 });
//                                 setTimeout(function () {
//                                     callback(null, posts);
//                                 }, 60);
//                             }
//                         ], function (err, result) {
//                             // Post.findOne({_id: '5b72cc73fae6c554a0290927'}, function (err, adPost) {
//                             //     var clone = Object.assign({}, adPost);
//                             //     delete clone._doc._id;
//                             //     console.log(clone._doc);
//                             //     clone._doc._id = Date.now().toString();
//                             //     result.unshift(clone._doc);
//                             //     console.log(result.length);
//                             //     res.send({
//                             //         success: true,
//                             //         posts: result
//                             //     });
//                             // });
//                             res.send({
//                                 success: true,
//                                 posts: result
//                             });
//                         });
//                     }
//                 });
//             }
//         }
//     });
// });

// posts with local ad
router.post('/post/getFollowingPosts', function (req, res) {
    console.log('called');
    var q = Following.find({userId: req.body.myId}, 'followingId');
    q.lean().exec(function (err, following) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            var ids = following.map(function (item) {
                return item['followingId'];
            });
            ids.push(req.body.myId);
            var limit = 10;
            var sort = {_id: -1};
            var project = {
                "postImageUrl": 1,
                "postVideoUrl": 1,
                "userId": 1,
                "userName": 1,
                "fullName": 1,
                "height": 1,
                "width": 1,
                "userDisplayPicture": 1,
                "date": 1,
                "location": 1,
                "tags": 1,
                "caption": 1,
                "likes": 1,
                "comments": 1,
                "latestComments": 1
            };
            if (req.body.lastId == "0") {
                var query = {userId: {
                    '$in': ids
                }};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            LocalAds.count().exec(function (err, count) {
                                var random = Math.floor(Math.random() * count);
                                LocalAds.findOne().skip(random).exec(
                                    function (err, ad) {
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ad: ad
                                        });
                                    });
                            });
                        });
                    }
                });
            }else{
                var query = {userId: {
                    '$in': ids
                }, _id: {'$lt': mongoose.Types.ObjectId(req.body.lastId)}};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            LocalAds.count().exec(function (err, count) {
                                var random = Math.floor(Math.random() * count);
                                LocalAds.findOne().skip(random).exec(
                                    function (err, ad) {
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ad: ad
                                        });
                                    });
                            });
                        });
                    }
                });
            }
        }
    });
});

// posts with local ad
router.post('/post/getNotFollowingPosts', function (req, res) {
    var q = Following.find({userId: req.body.myId}, 'followingId');
    q.lean().exec(function (err, following) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            var ids = following.map(function (item)  {
                return item['followingId'];
            });
            ids.push(req.body.myId);
            var limit = 10;
            var sort = {_id: -1};
            var project = {
                "postImageUrl": 1,
                "postVideoUrl": 1,
                "userId": 1,
                "userName": 1,
                "fullName": 1,
                "height": 1,
                "width": 1,
                "userDisplayPicture": 1,
                "date": 1,
                "location": 1,
                "tags": 1,
                "caption": 1,
                "likes": 1,
                "comments": 1,
                "latestComments": 1
            };
            if (req.body.lastId == "0") {
                var query = {userId: {
                    '$nin': ids
                }};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            LocalAds.count().exec(function (err, count) {
                                var random = Math.floor(Math.random() * count);
                                LocalAds.findOne().skip(random).exec(
                                    function (err, ad) {
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ad: ad
                                        });
                                    });
                            });
                        });
                    }
                });
            }else{
                var query = {userId: {
                    '$nin': ids
                }, _id: {'$lt': mongoose.Types.ObjectId(req.body.lastId)}};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            LocalAds.count().exec(function (err, count) {
                                var random = Math.floor(Math.random() * count);
                                LocalAds.findOne().skip(random).exec(
                                    function (err, ad) {
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ad: ad
                                        });
                                    });
                            });
                        });
                    }
                });
            }
        }
    });
});

router.post('/post/getFollowingPostsWithAds', function (req, res) {
    var q = Following.find({userId: req.body.myId}, 'followingId');
    q.lean().exec(function (err, following) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            var ids = following.map(function (item) {
                return item['followingId'];
            });
            ids.push(req.body.myId);
            var limit = 10;
            var sort = {_id: -1};
            var project = {
                "postImageUrl": 1,
                "postVideoUrl": 1,
                "userId": 1,
                "userName": 1,
                "fullName": 1,
                "height": 1,
                "width": 1,
                "userDisplayPicture": 1,
                "date": 1,
                "location": 1,
                "tags": 1,
                "caption": 1,
                "likes": 1,
                "comments": 1,
                "latestComments": 1
            };
            if (req.body.lastId == "0") {
                var query = {userId: {
                    '$in': ids
                }};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            /*res.send({
                             success: true,
                             posts: result
                             });*/
                            if(req.body.ad_network_id != "" && req.body.last_ad_id == "0"){
                                var q = Ads.find({ad_network_id: req.body.ad_network_id}).limit(2).sort({_id: -1});
                                q.lean().exec(function (err, ads) {
                                    if(err){
                                        res.status(404).send({
                                            success: false,
                                            ads: null
                                        });
                                    }else{
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ads: ads
                                        });
                                    }
                                });
                            }else{
                                res.send({
                                    success: true,
                                    posts: result
                                });
                            }
                        });
                    }
                });
            }else{
                var query = {userId: {
                    '$in': ids
                }, _id: {'$lt': mongoose.Types.ObjectId(req.body.lastId)}};
                Post.aggregate([
                    {"$match": query},
                    {"$sort": sort},
                    {"$limit": limit},
                    {"$project": project}
                ], function (err, posts) {
                    if (err) {
                        res.status(404).send({
                            success: false,
                            posts: null
                        });
                    } else {
                        async.waterfall([
                            function (callback) {
                                posts.forEach(function (post) {
                                    var q = Like.findOne({postId: post._id, userId: req.body.myId});
                                    q.lean().exec(function (err, data) {
                                        if (data) {
                                            post.isLiked = true;
                                        } else {
                                            post.isLiked = false;
                                        }
                                    });
                                });
                                setTimeout(function () {
                                    callback(null, posts);
                                }, 60);
                            }
                        ], function (err, result) {
                            /*res.send({
                                success: true,
                                posts: result
                            });*/
                            if(req.body.ad_network_id != "" && req.body.last_ad_id != "0"){
                                var q = Ads.find({ad_network_id: req.body.ad_network_id, _id: {'$lt': req.body.last_ad_id}}).limit(2).sort({_id: -1});
                                q.lean().exec(function (err, ads) {
                                    if(err){
                                        res.status(404).send({
                                            success: false,
                                            ads: null
                                        });
                                    }else{
                                        res.send({
                                            success: true,
                                            posts: result,
                                            ads: ads
                                        });
                                    }
                                });
                            }else{
                                res.send({
                                    success: true,
                                    posts: result
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

router.post('/user/userSuggestions', function (req, res) {
    var q = Following.find({userId: req.body.myId}, 'followingId');
    q.lean().exec(function (err, following) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            var ids = following.map(function (item) {
                return item['followingId'];
            });
            ids.push(req.body.myId);
            var project = {
                "_id": 1,
                "fullName": 1,
                "userName": 1,
                "displayPicture": 1,
                "followersCount": 1,
                "followingCount":1,
                "totalPostsCount":1
            };
            var query = {_id: {
                '$nin': ids
            }, totalPostsCount: {'$gt':50}, displayPicture: {'$ne':""}};
            var random = Math.floor(Math.random() * 500);
            User.find(query, project).skip(random).limit(20).exec(function (err, result) {
                if (err) {
                    res.status(404).send({
                        success: false,
                        users: null
                    });
                } else {
                    res.send({
                        success: true,
                        users: result
                    });
                }
            });
        }
    });
});

router.post('/post/get_all_posts', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Post.find({}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Post.find({_id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    }
});



var fileName = '';
var storage = multer.diskStorage({
    destination:  function (req, file, cb) {
        console.log(req.body.folderName);
        console.log(req.body.folderName);
        var newDestination = '/home/photex1/mongodb/public/posts/' + req.body.folderName + '/';
        var stat = null;
        try {
            stat = fs.statSync(newDestination);
        } catch (err) {
            fs.mkdirSync(newDestination);
        }
        if (stat && !stat.isDirectory()) {
            throw new Error(
                'Directory cannot be created because an inode of a different type exists at "' + dest + '"'
            );
        }
        cb(null, newDestination);
    },
    filename: function (req, file, cb) {
        /*fileName = uuid() + Date.now() + '.mp4';
        cb(null, fileName)*/
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage });

// ad post with custom post type
router.post('/post/add_post_with_type', upload.single('type'), function (req, res) {
    var postType = req.body.type;
    if(postType == 'image') {
        postType = 'image';
    }else if(postType == 'video') {
        postType = 'video';
    }else if(postType == '' || postType == undefined) console.log('undefined');
    else {
        postType = 'undefined';
    }
    console.log(postType);

    if(req.body.groupId == ""){
        var post = new Post({
            'postImageUrl': req.body.postImageUrl,
            'userId': req.body.userId,
            'userName': req.body.userName.trim(),
            'fullName': req.body.fullName.trim(),
            'userDisplayPicture': req.body.userDisplayPicture,
            'location': req.body.location,
            'tags': req.body.tags.split(','),
            'caption': req.body.caption.trim(),
            'height': req.body.height,
            'width': req.body.width,
            'postType': postType
        });
        post.save(function (err, post) {
            if (err) {
                res.status(404).send({
                    success: false
                });
            } else {
                var q = User.findOneAndUpdate({_id: req.body.userId}, {
                    $inc: {totalPostsCount: 1},
                    $set: {lastPostUploadedOn: post.date}
                });
                q.exec(function (err, done) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        res.send({
                            success: true,
                            lastId: post._id,
                            post: post
                        });
                    }
                });
            }
        });
    }else{
        var post = new Post({
            'postImageUrl': req.body.postImageUrl,
            'userId': req.body.userId,
            'userName': req.body.userName.trim(),
            'fullName': req.body.fullName.trim(),
            'userDisplayPicture': req.body.userDisplayPicture,
            'location': req.body.location,
            'tags': req.body.tags.split(','),
            'caption': req.body.caption.trim(),
            'height': req.body.height,
            'width': req.body.width,
            'groupId': req.body.groupId,
            'postType': postType
        });
        post.save(function (err, post) {
            if (err) {
                res.status(404).send({
                    success: false
                });
            } else {
                var q = User.findOneAndUpdate({_id: req.body.userId}, {
                    $inc: {totalPostsCount: 1},
                    $set: {lastPostUploadedOn: post.date}
                });
                q.exec(function (err, done) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        Group.findOneAndUpdate({'_id': req.body.groupId}, {$push:{postIds: post._id}}, function (err, done) {
                            if(err){
                                res.status(500).send({
                                    success: false
                                });
                            }else{
                                res.send({
                                    success: true,
                                    lastId: post._id,
                                    post: post
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/post/add_post', upload.single('image'), function (req, res) {
    if(req.body.groupId == ""){
        var post = new Post({
            'postImageUrl': req.body.postImageUrl,
            'userId': req.body.userId,
            'userName': req.body.userName.trim(),
            'fullName': req.body.fullName.trim(),
            'userDisplayPicture': req.body.userDisplayPicture,
            'location': req.body.location,
            'tags': req.body.tags.split(','),
            'caption': req.body.caption.trim(),
            'height': req.body.height,
            'width': req.body.width,
        });
        post.save(function (err, post) {
            if (err) {
                res.status(404).send({
                    success: false
                });
            } else {
                var q = User.findOneAndUpdate({_id: req.body.userId}, {
                    $inc: {totalPostsCount: 1},
                    $set: {lastPostUploadedOn: post.date}
                });
                q.exec(function (err, done) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        res.send({
                            success: true,
                            lastId: post._id
                        });
                    }
                });
            }
        });
    }else{
        var post = new Post({
            'postImageUrl': req.body.postImageUrl,
            'userId': req.body.userId,
            'userName': req.body.userName.trim(),
            'fullName': req.body.fullName.trim(),
            'userDisplayPicture': req.body.userDisplayPicture,
            'location': req.body.location,
            'tags': req.body.tags.split(','),
            'caption': req.body.caption.trim(),
            'height': req.body.height,
            'width': req.body.width,
            'groupId': req.body.groupId
        });
        User.findOne({_id:req.body.userId}, function(err, user) {
            if(user.blocked) {
                res.send({success: false, message: 'This user is blocked!'});
            } else {
                post.save(function (err, post) {
                    if (err) {
                        res.status(404).send({
                            success: false
                        });
                    } else {
                        var q = User.findOneAndUpdate({_id: req.body.userId}, {
                            $inc: {totalPostsCount: 1},
                            $set: {lastPostUploadedOn: post.date}
                        });
                        q.exec(function (err, done) {
                            if (err) {
                                res.status(404).send({
                                    success: false
                                });
                            } else {
                                Group.findOneAndUpdate({'_id': req.body.groupId}, {$push:{postIds: post._id}}, function (err, done) {
                                    if(err){
                                        res.status(500).send({
                                            success: false
                                        });
                                    }else{
                                        res.send({
                                            success: true,
                                            lastId: post._id
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/user/update_display_picture',upload.array('dp'), function (req, res) {
    var oldDateObj = new Date();
    var date = new Date(oldDateObj.getTime() + 300 * 60000);
    var datetime = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var datetime_mod;
    datetime_mod = datetime.toString();
    datetime_mod = datetime_mod.replace("-", "");
    datetime_mod = datetime_mod.replace("-", "");
    datetime_mod = datetime_mod.replace(" ", "");
    datetime_mod = datetime_mod.replace(":", "");
    datetime_mod = datetime_mod.replace(":", "");

    var query = {'_id': req.body.userId};
    var user = new Object({
        'displayPicture': req.body.displayPicture,
        'fullDisplayPicture': req.body.fullDisplayPicture,
        'displayPictureLastModified': datetime_mod

    });

    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    displayPictureLastModified: "",
                    success: false
                }
            );
        } else if (user) {
            res.send(
                {
                    displayPictureLastModified: user.displayPictureLastModified,
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    displayPictureLastModified: "",
                    success: false
                }
            );
        }
    });
});

router.post('/user/update_backcover_picture',upload.single('cover'), function (req, res) {
    var query = {'_id': req.body.userId};
    var user = new Object({
        'backCoverDisplayPicture': req.body.backCoverDisplayPicture

    });
    User.findOneAndUpdate(query, user, function (err, user) {
        if (err) {
            res.status(404).send(
                {
                    success: false
                }
            );
        } else if (user) {
            res.send(
                {
                    success: true
                }
            );
        } else {
            res.status(200).send(
                {
                    success: false
                }
            );
        }
    });
});

// router.post('/update_dp', upload.single('dp'), function (req, res) {
//     var oldDateObj = new Date();
//     var date = new Date(oldDateObj.getTime() + 300 * 60000);
//     var datetime = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
//     var datetime_mod;
//     datetime_mod = datetime.toString();
//     datetime_mod = datetime_mod.replace("-", "");
//     datetime_mod = datetime_mod.replace("-", "");
//     datetime_mod = datetime_mod.replace(" ", "");
//     datetime_mod = datetime_mod.replace(":", "");
//     datetime_mod = datetime_mod.replace(":", "");
//
//     var query = {'_id': req.body.userId};
//     var user = new Object({
//         'displayPicture': req.body.displayPicture,
//         'fullDisplayPicture': req.body.fullDisplayPicture,
//         'displayPictureLastModified': datetime_mod
//
//     });
//
//     User.findOneAndUpdate(query, user, function (err, user) {
//         if (err) {
//             res.status(404).send(
//                 {
//                     displayPictureLastModified: "",
//                     success: false
//                 }
//             );
//         } else if (user) {
//             res.send(
//                 {
//                     displayPictureLastModified: user.displayPictureLastModified,
//                     success: true
//                 }
//             );
//         } else {
//             res.status(200).send(
//                 {
//                     displayPictureLastModified: "",
//                     success: false
//                 }
//             );
//         }
//     });
// });
//
// router.get('/test', function (req, res) {
//     console.log('rendering...');
//    res.render('test',{});
// });

// get specific user's all posts for pannel
router.post('/post/get_my_all_posts', function (req, res) {
    var query = Post.find({userId: req.body.userId}).sort({_id: -1});
    query.lean().exec(function (err, posts) {
        if (err) res.send({success: false});
        else res.send({posts: posts});
    });
});

router.post('/post/get_my_posts', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Post.find({userId: req.body.myId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Post.find({userId: req.body.myId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {

                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    }
});
router.post('/post/get_user_posts', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Post.find({userId: req.body.userId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Post.find({userId: req.body.userId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, posts) {
            if (err) {

                res.status(404).send(
                    {
                        success: false,
                        posts: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        posts.forEach(function (post) {
                            var q = Like.findOne({postId: post._id, userId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    post.isLiked = true;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                } else {
                                    post.isLiked = false;
                                    var q = commentReply.count({postId: post._id});
                                    q.lean().exec(function (err, replies) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            post.allComments = replies + post.comments;
                                        }
                                    });
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, posts);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            posts: result
                        }
                    );
                });
            }
        });
    }
});
router.post('/post/delete_post', function (req, res) {
    Post.where({_id: req.body.postId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            User.findOneAndUpdate({_id: req.body.userId}, {$inc: {totalPostsCount: -1}}, function (err) {
                if (err) {
                    res.status(404).send(
                        {
                            success: false
                        }
                    );
                } else {
                    res.send(
                        {
                            success: true
                        }
                    );
                }
            });
        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});

router.post('/post/deleteUserPosts', function (req, res) {
    Post.remove({userId: req.body.userId}, function (err) {
        if(err){
            res.status(404).send({
                success: false
            });
        }else{
            User.findOneAndUpdate({_id: req.body.userId}, {$set: {totalPostsCount: 0}}, function (err) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else {
                    res.send({
                        success: true
                    });
                }
            });
        }
    });
});

//comments
router.post('/post/comment', function (req, res) {
    async.waterfall([
        function (saveCommentCallback) {
            var comment = new Comment({
                'userName': req.body.userName.trim(),
                'fullName': req.body.fullName.trim(),
                'userId': req.body.userId,
                'comment': req.body.comment.trim(),
                'userDisplayPicture': req.body.userDisplayPicture,
                'postId': req.body.postId
            });
            comment.save(function (err, like) {
                if (err){
                    saveCommentCallback(err);
                }else{
                    saveCommentCallback(null, comment);
                }
            });
        },
        function (comment, addCommentInLatestCommentsCallback) {
            Post.findOneAndUpdate({_id: req.body.postId}, {
                $push: {latestComments: comment},
                $inc: {comments: 1}
            }, function (err, post) {
                if (err){
                    addCommentInLatestCommentsCallback(err);
                }else{
                    addCommentInLatestCommentsCallback(null);
                }
            });
        },
        function (popCommentInLatestCommentsCallback) {
            Post.findOneAndUpdate({
                _id: req.body.postId,
                comments: {$gt: 3}
            }, {$pop: {latestComments: -1}}, function (err, comment) {
                if (err){
                    popCommentInLatestCommentsCallback(err);
                }else{
                    popCommentInLatestCommentsCallback(null);
                }
            });
        },
        function (saveNotificationCallback) {
            if(req.body.postBy == '' || req.body.postBy == undefined){
                res.send({
                    success: true
                });
            }else {
                if (req.body.userId != req.body.postBy) {
                    var notification = new Notification({
                        'postId': req.body.postId,
                        'fullName': req.body.fullName.trim(),
                        'userName': req.body.userName.trim(),
                        'userId': req.body.userId,
                        'userDisplayPicture': req.body.userDisplayPicture,
                        'myId': req.body.postBy,
                        'notification_type': 'comment',
                        'status': 'unread'
                    });
                    notification.save(function (err, data) {
                        if (err){
                            saveNotificationCallback(err);
                        }else{
                            saveNotificationCallback(null);
                        }
                    });
                }else{
                    res.send({
                        msg: 'self comment',
                        success: true
                    });
                }
            }
        },
        function (countNotificationCallback) {
            var q = NotifyCount.findOne({userId: req.body.postBy});
            q.lean().exec(function (err, result) {
                if (err){
                    countNotificationCallback(err);
                }else{
                    countNotificationCallback(null, result);
                }
            });
        },
        function (result, incrementCountCallback) {
            if(result == null){
                var notify = new NotifyCount({
                    'total': 1,
                    'userId': req.body.postBy
                });
                notify.save(function (err, data) {
                    if (err){
                        incrementCountCallback(err);
                    }else{
                        incrementCountCallback(null);
                    }
                });
            }else {
                NotifyCount.findOneAndUpdate({userId: req.body.postBy}, {
                    $inc: {total: 1}
                }, function (err) {
                    if (err){
                        incrementCountCallback(err);
                    }else{
                        incrementCountCallback(null);
                    }
                });
            }
        },
        function (getUserInfoCallback) {
            var q = User.findOne({_id: req.body.postBy});
            q.lean().exec(function (err, userInfo) {
                if(err){
                    getUserInfoCallback(err);
                }else{
                    getUserInfoCallback(null, userInfo);
                }
            });
        },
        function (userInfo, sendNotificationCallback) {
            if (userInfo.fcmKey != "0" && userInfo.fcmKey != "" && userInfo.fcmKey != undefined) {
                var serverKey = 'AIzaSyBdwE3KIKwR50d4NziJPJDsTdL_TrWXlE0';
                var fcm = new FCM(serverKey);
                var message = {
                    to: userInfo.fcmKey,
                    collapse_key: 'test',
                    data: {
                        your_custom_data_key: 'comment',
                        userId: req.body.userId,
                        fullName: req.body.fullName,
                        postId: req.body.postId,
                        profilePicture: req.body.userDisplayPicture,
                        date:  new Date()
                    }
                };
                fcm.send(message)
                    .then(function (response) {
                        console.log("Successfully sent with response: ", response);
                        sendNotificationCallback(null, 'done');
                        /*res.send({
                         success: true
                         });*/
                    })
                    .catch(function (err) {
                        console.log("Something has gone wrong! Comment");
                        console.error(err);
                        sendNotificationCallback(err);
                        /*res.send({
                         success: false
                         });*/
                    })
            }
            // sendNotificationCallback(null, 'done');
        }
    ], function (err, result) {
        if(err){
            res.send({
                success: false
            });
        }else{
            res.send({
                success: true
            });
        }
    });
});

router.post('/post/get_comments', function (req, res) {
    if (req.body.lastId == "0") {
        var q = Comment.find({postId: req.body.postId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, comments) {
            if (err) {

                res.status(404).send(
                    {
                        success: false,
                        comments: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        comments: comments
                    }
                );
            }
        });
    } else {
        var q = Comment.find({postId: req.body.postId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, comments) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        comments: null
                    }
                );
            } else {
                res.send(
                    {
                        success: true,
                        comments: comments
                    }
                );
            }
        });
    }
});

//delete comment
router.post('/post/delete_comment', function (req, res) {
    Comment.where({_id: req.body.commentId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            var q = Comment.find({postId: req.body.postId}, '_id fullName userName userId userDisplayPicture comment postId').sort({_id: -1}).limit(3);
            q.exec(function (err, comments) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else {
                    var q = Post.findOneAndUpdate({_id: req.body.postId}, {
                        $inc: {comments: -1},
                        $set: {latestComments: comments.reverse()}
                    });
                    q.exec(function (err, done) {
                        if (err) {
                            res.status(404).send({
                                success: false
                            });
                        } else {
                            res.status(200).send({
                                success: true
                            });
                        }
                    });
                }
            });

        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});

//update post
router.post('/post/update_post', function (req, res) {
    var postId = req.body.postId;
    var caption = req.body.caption;
    console.log(postId, caption, req.body.userId);
    Post.findOneAndUpdate({_id: postId, userId: req.body.userId}, {
        $set: {caption: caption}
    }, function (err) {
        //console.log(err);
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

//update comment
router.post('/post/update_comment', function (req, res) {
    var commentId = req.body.commentId;
    var comment = req.body.comment;
    var postId = req.body.postId;

    Comment.findOneAndUpdate({_id: commentId, userId: req.body.userId}, {
        $set: {comment: comment}
    }, function (err) {
        //console.log(err);
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            Post.findOne({_id: postId}, function (error, post) {
               for(var i = 0; i<post.latestComments.length; i++) {
                   if (post.latestComments[i]._id == commentId) {
                       console.log('updating in latest comments')
                       post.latestComments[i].comment = comment;
                   }
               }
               Post.update({_id: postId}, {$set: {latestComments: post.latestComments}}, function (error, post) {
                   console.log(post);
                   res.send({
                       success: true
                   });
               });
            });
        }
    });
});

//update comment
router.post('/post/update_comment_reply', function (req, res) {
    var commentId = req.body.commentId;
    var comment = req.body.comment;
    console.log(commentId);
    console.log(comment);
    console.log(req.body.userId);
    commentReply.findOneAndUpdate({_id: commentId, userId: req.body.userId}, {
        $set: {comment: comment}
    }, function (err) {
        //console.log(err);
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

//delete comment reply
router.post('/post/deleteCommentReply', function (req, res) {
    commentReply.where({_id: req.body.commentReplyId}, {userId: req.body.userId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            var q = commentReply.find({parentCommentId: req.body.parentCommentId}, '_id fullName userName userId userDisplayPicture comment postId').sort({_id: -1}).limit(1);
            q.exec(function (err, comments) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else if(comments){
                    var q = Comment.findOneAndUpdate({_id: req.body.parentCommentId}, {
                        $inc: {numOfCommentReplies: -1},
                        $set: {commentReply: comments}
                    });
                    q.exec(function (err, done) {
                        if (err) {
                            res.status(404).send({
                                success: false
                            });
                        } else {
                            res.status(200).send({
                                success: true
                            });
                        }
                    });
                }else {
                    res.status(404).send({
                        success: false
                    });
                }
            });

        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});

router.post('/post/commentReply', function (req, res) {
    var comment = new commentReply({
        'userName': req.body.userName.trim(),
        'fullName': req.body.fullName.trim(),
        'userId': req.body.userId,
        'comment': req.body.comment.trim(),
        'userDisplayPicture': req.body.userDisplayPicture,
        'postId': req.body.postId,
        'parentCommentId': req.body.parentCommentId
    });
    comment.save(function (err, comment) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            Comment.findOneAndUpdate({_id: req.body.parentCommentId}, {
                $push: {commentReply: comment},
                $inc: {numOfCommentReplies: 1}
            }, function (err, post) {
                if (err) {
                    res.status(404).send(
                        {
                            success: false
                        }
                    );
                } else {
                    Comment.findOneAndUpdate({
                        _id: req.body.parentCommentId,
                        numOfCommentReplies: {$gt: 1}
                    }, {$pop: {commentReply: -1}}, function (err, comment) {
                        if (err) {
                            res.status(404).send(
                                {
                                    success: false
                                }
                            );
                        } else {
                            var q = commentReply.distinct("userId", {parentCommentId: req.body.parentCommentId});
                            q.exec(function (err, ids) {
                                if(err){
                                    res.status(404).send({
                                        success: false
                                    });
                                }else {

                                    Array.prototype.contains = function(v) {
                                        for(var i = 0; i < this.length; i++) {
                                            if(this[i] === v) return true;
                                        }
                                        return false;
                                    };

                                    Array.prototype.unique = function() {
                                        var arr = [];
                                        for(var i = 0; i < this.length; i++) {
                                            if(!arr.contains(this[i])) {
                                                arr.push(this[i]);
                                            }
                                        }
                                        return arr;
                                    };

                                    ids.push(req.body.postBy);
                                    ids.push(req.body.parentCommentUserId);

                                    ids = ids.unique();

                                    async.waterfall([
                                        function (callback) {
                                            ids.forEach(function (id) {
                                                User.findOne({_id: id}, function (err, userData) {
                                                    /*console.log("--------------");
                                                     console.log(id);
                                                     console.log(userData.fcmKey);
                                                     console.log("--------------");*/
                                                    if(err){
                                                        res.status(404).send({
                                                            success: false
                                                        });
                                                    }else if (userData != null && userData != undefined){
                                                        if(id != req.body.userId){
                                                            var notification = new Notification({
                                                                'postId': req.body.postId,
                                                                'fullName': req.body.fullName,
                                                                'userName': req.body.userName,
                                                                'userId': req.body.userId,
                                                                'userDisplayPicture': req.body.userDisplayPicture,
                                                                'myId': id,
                                                                'commentId': req.body.parentCommentId,
                                                                'notification_type': 'comment_reply',
                                                                'status':'unread'
                                                            });

                                                            notification.save(function (err, data) {
                                                                if (err) {
                                                                    res.status(404).send({
                                                                        success: false
                                                                    });
                                                                } else {
                                                                    var q = NotifyCount.findOne({userId: id});
                                                                    q.lean().exec(function (err, result) {
                                                                        if(err){
                                                                            res.status(404).send({
                                                                                success: false
                                                                            });
                                                                        }else if(result == null){
                                                                            var notify = new NotifyCount({
                                                                                'total': 1,
                                                                                'userId': id
                                                                            });
                                                                            notify.save(function (err, data) {
                                                                                if (err) {
                                                                                    res.status(404).send({
                                                                                        success: false
                                                                                    });
                                                                                } else {
                                                                                    if (userData.fcmKey != "0" && userData.fcmKey != "" && userData.fcmKey != undefined && id != req.body.userId) {
                                                                                        var serverKey = 'AIzaSyBdwE3KIKwR50d4NziJPJDsTdL_TrWXlE0';
                                                                                        var fcm = new FCM(serverKey);

                                                                                        var message = {
                                                                                            to: userData.fcmKey,
                                                                                            collapse_key: 'test',
                                                                                            data: {
                                                                                                your_custom_data_key: 'comment_reply',
                                                                                                userId: req.body.userId,
                                                                                                fullName: req.body.fullName,
                                                                                                postId: req.body.postId,
                                                                                                profilePicture: req.body.userDisplayPicture,
                                                                                                date:  new Date()
                                                                                            }
                                                                                        };

                                                                                        fcm.send(message)
                                                                                            .then(function (response) {
                                                                                                console.log("Successfully sent with response: ", response);
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log("Something has gone wrong! commentReply 1");
                                                                                            })
                                                                                    }
                                                                                }
                                                                            });
                                                                        }else {
                                                                            NotifyCount.findOneAndUpdate({userId: id}, {
                                                                                $inc: {total: 1}
                                                                            }, function (err, uData) {
                                                                                if (err) {
                                                                                    res.status(404).send({
                                                                                        success: false
                                                                                    });
                                                                                } else {
                                                                                    if (userData.fcmKey != "0" && userData.fcmKey != "" && userData.fcmKey != undefined && id != req.body.userId) {
                                                                                        var serverKey = 'AIzaSyBdwE3KIKwR50d4NziJPJDsTdL_TrWXlE0';
                                                                                        var fcm = new FCM(serverKey);

                                                                                        var message = {
                                                                                            to: userData.fcmKey,
                                                                                            collapse_key: 'test',
                                                                                            data: {
                                                                                                your_custom_data_key: 'comment_reply',
                                                                                                userId: req.body.userId,
                                                                                                fullName: req.body.fullName,
                                                                                                postId: req.body.postId,
                                                                                                profilePicture: req.body.userDisplayPicture,
                                                                                                date:  new Date()
                                                                                            }
                                                                                        };

                                                                                        fcm.send(message)
                                                                                            .then(function (response) {
                                                                                                console.log("Successfully sent with response: ", response);
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log("Something has gone wrong! commentReply 2");
                                                                                            })
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                })
                                            });
                                            setTimeout(function () {
                                                callback(null, ids);
                                            }, 60);

                                        }
                                    ], function (err, result) {
                                        res.send(
                                            {
                                                success: true
                                                //result:result       //remove this line
                                            }
                                        );
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

router.post('/post/getlatestUserRegistered', function (req, res) {
    if(req.body.lastId == 0){
        var q = User.find({emailId: ""}).sort({_id: -1}).limit(100);
        q.exec(function (err, replies) {
            if(err){
                res.status(404).send({
                    success: false,
                    users: null
                });
            }else {
                res.send({
                    success: true,
                    users: replies
                });
            }
        });
    }else{
        var q = User.find({emailId: "", _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(100);
        q.exec(function (err, replies) {
            if(err){
                res.status(404).send({
                    success: false,
                    users: null
                });
            }else {
                res.send({
                    success: true,
                    users: replies
                });
            }
        });
    }
});

//update comment reply
router.post('/post/updateCommentReply', function (req, res) {
    var comment = new Object({
        'comment': req.body.comment.trim()
    });
    commentReply.findOneAndUpdate({_id: req.body.commentId, userId: req.body.userId}, comment, function (err, comment) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (comment){
            Comment.findOneAndUpdate({"_id": req.body.parentCommentId, "commentReply._id": req.body.commentId}, {
                "$set": {
                    "commentReply.$.comment": req.body.comment.trim()
                }
            }, function (err, post) {
                if (err) {
                    res.status(404).send(
                        {
                            success: false
                        }
                    );
                } else if (post) {
                    res.send(
                        {
                            success: true
                        }
                    );
                } else {
                    res.status(200).send(
                        {
                            success: false
                        }
                    );
                }
            });
        } else {
            res.status(200).send({
                success: false
            });
        }
    });
});

router.post('/post/getCommentReplies', function (req, res) {
    if(req.body.lastId == 0){
        var q = commentReply.find({parentCommentId: req.body.parentCommentId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, replies) {
            if(err){
                res.status(404).send({
                    success: false,
                    replies: null
                });
            }else {
                res.send({
                    success: true,
                    replies: replies
                });
            }
        });
    }else{
        var q = commentReply.find({parentCommentId: req.body.parentCommentId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, replies) {
            if(err){
                res.status(404).send({
                    success: false,
                    replies: null
                });
            }else {
                res.send({
                    success: true,
                    replies: replies
                });
            }
        });
    }
});

//like
router.post('/post/like', function (req, res) {
    async.waterfall([
        function (saveLikeCallback) {
            var like = new Like({
                'userName': req.body.userName,
                'userId': req.body.userId,
                'userDisplayPicture': req.body.userDisplayPicture,
                'postId': req.body.postId,
                'fullName': req.body.fullName
            });
            like.save(function (err, like) {
                if (err){
                    saveLikeCallback(err);
                }else{
                    saveLikeCallback(null);
                }
            });
        },
        function (incLikeInPostCallback) {
            Post.findOneAndUpdate({_id: req.body.postId}, {$inc: {likes: 1}}, function (err, like) {
                if (err){
                    incLikeInPostCallback(err);
                }else{
                    incLikeInPostCallback(null);
                }
            });
        },
        function (saveNotificationCallback) {
            if(req.body.postBy == '' || req.body.postBy == undefined) {
                res.send({
                    success: true
                });
            }else {
                if(req.body.userId != req.body.postBy){
                    var notification = new Notification({
                        'postId': req.body.postId,
                        'fullName': req.body.fullName,
                        'userName': req.body.userName,
                        'userId': req.body.userId,
                        'userDisplayPicture': req.body.userDisplayPicture,
                        'myId': req.body.postBy,
                        'notification_type': 'like',
                        'status': 'unread'
                    });
                    notification.save(function (err, like) {
                        if (err){
                            saveNotificationCallback(err);
                        }else{
                            saveNotificationCallback(null);
                        }
                    });
                }else{
                    res.send({
                        msg: 'self like',
                        success: true
                    });
                }
            }
        },
        function (countNotificationCallback) {
            var q = NotifyCount.findOne({userId: req.body.postBy});
            q.lean().exec(function (err, result) {
                if (err){
                    countNotificationCallback(err);
                }else{
                    countNotificationCallback(null, result);
                }
            });
        },
        function (result, incrementCountCallback) {
            if(result == null){
                var notify = new NotifyCount({
                    'total': 1,
                    'userId': req.body.postBy
                });
                notify.save(function (err, data) {
                    if (err){
                        incrementCountCallback(err);
                    }else{
                        incrementCountCallback(null);
                    }
                });
            }else {
                NotifyCount.findOneAndUpdate({userId: req.body.postBy}, {
                    $inc: {total: 1}
                }, function (err) {
                    if (err){
                        incrementCountCallback(err);
                    }else{
                        incrementCountCallback(null);
                    }
                });
            }
        },
        function (getUserInfoCallback) {
            var q = User.findOne({_id: req.body.postBy});
            q.lean().exec(function (err, userInfo) {
                if(err){
                    getUserInfoCallback(err);
                }else{
                    getUserInfoCallback(null, userInfo);
                }
            });
        },
        function (userInfo, sendNotificationCallback) {
            if (userInfo.fcmKey != "0" && userInfo.fcmKey != "" && userInfo.fcmKey != undefined) {
                var serverKey = 'AIzaSyBdwE3KIKwR50d4NziJPJDsTdL_TrWXlE0';
                var fcm = new FCM(serverKey);
                var message = {
                    to: userInfo.fcmKey,
                    collapse_key: 'test',
                    data: {
                        your_custom_data_key: 'like',
                        userId: req.body.userId,
                        fullName: req.body.fullName,
                        postId: req.body.postId,
                        profilePicture: req.body.userDisplayPicture,
                        date:  new Date()
                    }
                };
                fcm.send(message)
                    .then(function (response) {
                        console.log("Successfully sent with response: ", response);
                        /*res.send({
                         success: true
                         });*/
                        sendNotificationCallback(null, 'done');
                    })
                    .catch(function (err) {
                        console.log("Something has gone wrong! Like");
                        console.error(err);
                        /*res.send({
                         success: false
                         });*/
                        sendNotificationCallback(err);
                    })
            }
            //sendNotificationCallback(null, 'done');
        }
    ], function (err, result) {
        if(err){
            res.send({
                success: false
            });
        }else{
            res.send({
                success: true
            });
        }
    });
});

router.post('/post/get_likes', function (req, res) {

    if (req.body.lastId == 0) {
        var q = Like.find({postId: req.body.postId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, likes) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        likes: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        likes.forEach(function (like) {
                            var q = Follower.findOne({userId: like.userId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    like.isFollowed = true;

                                } else {
                                    like.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, likes);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            likes: result
                        }
                    );
                });
            }
        });
    } else {
        var q = Like.find({postId: req.body.postId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, likes) {
            if (err) {
                res.send(
                    {
                        success: false,
                        likes: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        likes.forEach(function (like) {
                            var q = Follower.findOne({userId: like.userId, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    like.isFollowed = true;

                                } else {
                                    like.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, likes);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            likes: result
                        }
                    );
                });
            }
        });
    }
});

//unlike
router.post('/post/unlike', function (req, res) {
    Like.where({postId: req.body.postId, userId: req.body.userId}).findOneAndRemove(function (err, data) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else if (data) {
            Post.findOneAndUpdate({_id: req.body.postId}, {$inc: {likes: -1}}, function (err) {
                if (err) {
                    res.status(404).send({
                        success: false
                    });
                } else {
                    res.send({
                        success: true
                    });
                }
            });
        } else {
            res.status(404).send({
                success: false
            });
        }
    });
});
router.post('/user/delete_user', function (req, res) {
    User.remove({emailId: req.body.emailId}, function (err, data) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});

//users list latest 100
router.post('/user/search1', function (req, res) {
    var totalPost = req.body.posts;
    if (totalPost == "0") {
        User.find({}).limit(20).sort({totalPostsCount: -1}).exec(function (err, collection) {   res.send({
            collection: collection
        });
        });
    } else {
        User.find({totalPostsCount: {'$lt': totalPost}}).limit(20).sort({totalPostsCount: -1}).exec(function (err, collection) {
            res.send({
                collection: collection
            });
        })
    }
});

router.post('/user/get_active_users',function (req,res) {
    var myId = req.body.myId;
    var skip = req.body.skip;
    var date = new Date();
    date.setMonth(date.getMonth() - 1);

    var q = User.find({lastPostUploadedOn: {"$gte": date.toISOString(), "$lte": new Date().toISOString()}}).select({
        "fullName": 1,
        "_id": 1,
        "userName": 1,
        "displayPicture": 1
        //"followersCount": 1,
        //"totalPostsCount":1,
        //"lastPostUploadedOn":1
    }).limit(20).sort({totalPostsCount: -1}).skip(skip);
    q.lean().exec(function (err, users) {
        if(err){
            res.status(404).send({
                success: false,
                users: null
            })
        }else{
            async.waterfall([
                function (callback) {
                    users.forEach(function (user) {
                        var q = Follower.findOne({userId: user._id, followerId: myId});
                        q.lean().exec(function (err, data) {
                            if (data) {
                                user.isFollowed = true;
                            } else {
                                user.isFollowed = false;
                            }
                        });
                    });
                    setTimeout(function () {
                        callback(null, users);
                    }, 60);
                }
            ], function (err, result) {
                res.send({
                    success: true,
                    users: users
                });
            });
        }
    });
});

router.post('/user/get_latest_users',function (req,res) {
    var totalPost = req.body.posts;
    var myId = req.body.myId;
    if (totalPost == "0") {
        var q = User.find({}).select({
            "fullName": 1,
            "_id": 1,
            "userName": 1,
            "followersCount": 1,
            "displayPicture": 1,
            "totalPostsCount":1
        }).limit(20).sort({totalPostsCount: -1});
        q.lean().exec(function (err, users) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        users: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        users.forEach(function (user) {
                            var q = Follower.findOne({userId: user._id, followerId: myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;

                                } else {
                                    user.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, users);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            users: result
                        }
                    );
                });
            }
        });
    } else {
        var q = User.find({totalPostsCount: {'$lt': totalPost}}).select({
            "fullName": 1,
            "_id": 1,
            "userName": 1,
            "followersCount": 1,
            "displayPicture": 1,
            "totalPostsCount":1
        }).limit(20).sort({totalPostsCount: -1});
        q.lean().exec(function (err, users) {
            if (err) {
                res.status(404).send(
                    {
                        success: false,
                        users: null
                    }
                );
            } else {
                async.waterfall([
                    function (callback) {
                        users.forEach(function (user) {
                            var q = Follower.findOne({userId: user._id, followerId: req.body.myId});
                            q.lean().exec(function (err, data) {
                                if (data) {
                                    user.isFollowed = true;

                                } else {
                                    user.isFollowed = false;
                                }
                            });
                        });
                        setTimeout(function () {
                            callback(null, users);
                        }, 60);

                    }
                ], function (err, result) {
                    res.send(
                        {
                            success: true,
                            users: result
                        }
                    );
                });
            }
        });
    }
});

router.post('/post/get_post_info',function (req,res) {
    var postId = req.body.postId;
    var myId = req.body.myId;
    var q = Post.find({_id:postId});
    q.lean().exec(function (err, posts) {
        if (err) {
            res.status(404).send({
                success: false,
                post: null
            });
        } else {
            async.waterfall([
                function (callback) {
                    posts.forEach(function (post) {
                        var q = Like.findOne({userId: myId, postId: postId});
                        q.lean().exec(function (err, data) {
                            if (data) {
                                post.isLiked = true;
                                var q = commentReply.count({postId: req.body.postId});
                                q.lean().exec(function (err, replies) {
                                    if (err) {
                                        console.log(err);
                                    }else{
                                        post.allComments = replies + post.comments;
                                    }
                                });
                            } else {
                                post.isLiked = false;
                                var q = commentReply.count({postId: req.body.postId});
                                q.lean().exec(function (err, replies) {
                                    if (err) {
                                        console.log(err);
                                    }else{
                                        post.allComments = replies + post.comments;
                                    }
                                });
                            }
                        });
                    });
                    setTimeout(function () {
                        callback(null, posts);
                    }, 60);

                }
            ], function (err, result) {
                res.send(
                    {
                        success: true,
                        post: result
                    }
                );
            });
        }
    });
});

//read notification
router.post('/read',function (req,res) {
    Notification.findByIdAndUpdate(req.body.notifyId, { status: 'read'}, function (err, result) {
        if (err) {
            res.send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});
//apk version
router.get('/apk_version',function(req, res, next) {
    var q = Apk.find({}).sort({_id: -1});
    q.lean().exec(function (err, result) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true,
                apkInfo:result
            });
        }
    });
});

//users list latest 100
router.post('/user/search1', function (req, res) {
    var totalPost = req.body.posts;
    if (totalPost == "0") {
        User.find({}).limit(20).sort({totalPostsCount: -1}).exec(function (err, collection) {   res.send({
            collection: collection
        });
        });
    } else {
        User.find({totalPostsCount: {'$lt': totalPost}}).limit(20).sort({totalPostsCount: -1}).exec(function (err, collection) {
            res.send({
                collection: collection
            });
        })
    }
});

//users list latest 50000
router.post('/user/last_user', function (req, res) {
    var user = req.body.userId;
    if (user == "0") {
        User.find({}).limit(50000).sort({_id: 1}).exec(function (err, collection) {   res.send({
            collection: collection
        });
        });
    } else {
        User.find({_id: {'$gt': user}}).limit(50000).sort({_id: 1}).exec(function (err, collection) {
            res.send({
                collection: collection
            });
        })
    }
});
router.post('/user/update_followers_count', function(req, res){
    var user = req.body.userId;
    var q = User.find({_id: {'$gt': user}}).sort({_id: 1}).limit(5000);
    q.lean().exec(function (err, result) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            sequence
                .then(function (next) {
                    result.forEach(function (result) {
                        Follower.count({userId: result._id}, function (err, c) {
                            if (err) {
                                res.send({
                                    success: false
                                });
                            } else {
                                //console.log('this is a bad day');

                                User.findOneAndUpdate({_id: result._id}, {
                                    $set: {followersCount: c}
                                }, function (err) {
                                    //console.log(err);
                                    if (err) {
                                        res.status(404).send({
                                            success: false
                                        });
                                    } else {
                                        next();
                                    }
                                });
                            }
                        });
                    });
                })
                .then(function (next) {
                    res.status(200).send({
                        success: true
                    });
                })
        }
    });
});
router.post('/user/update_following_count', function(req, res){
    var user = req.body.userId;
    var q = User.find({_id: {'$gt': user}}).sort({_id: 1}).limit(5000);
    q.lean().exec(function (err, result) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            sequence
                .then(function (next) {
                    result.forEach(function (result) {
                        Following.count({userId: result._id}, function (err, c) {
                            if (err) {
                                res.send({
                                    success: false
                                });
                            } else {
                                User.findOneAndUpdate({_id: result._id}, {
                                    $set: {followingCount: c}
                                }, function (err) {
                                    //console.log(err);
                                    if (err) {
                                        res.status(404).send({
                                            success: false
                                        });
                                    } else {
                                        next();
                                    }
                                });
                            }
                        });
                    });
                })
                .then(function (next) {
                    res.status(200).send({
                        success: true
                    });
                })
        }
    });

});

// chat start here
router.post('/user/send_message', function (req, res) {
    var chat = new Chat({
        senderId: req.body.senderId,
        senderUserName: req.body.senderUserName,
        senderDisplayPicture: req.body.senderDisplayPicture,
        receiverId: req.body.receiverId,
        receiverUserName: req.body.receiverUserName,
        receiverDisplayPicture: req.body.receiverDisplayPicture,
        text: req.body.text,
        image: req.body.image,
        audio: req.body.audio
    });
    chat.save(function (err, chat) {
        if (err) {
            res.status(404).send({
                success: false
            });
        } else {
            res.send({
                success: true
            });
        }
    });
});
router.post('/user/get_messages',function (req,res) {
    if(req.body.lastId==0) {
        var q = Chat.find({senderId: req.body.senderId, receiverId: req.body.receiverId}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, result) {
            if (err) {
                console.log(err);
                res.status(404).send({
                    success: false
                });
            } else {
                res.send({
                    messages: result
                });
            }
        });
    }else{
        var q = Chat.find({senderId: req.body.senderId, receiverId: req.body.receiverId, _id: {'$lt': req.body.lastId}}).sort({_id: -1}).limit(10);
        q.lean().exec(function (err, result) {
            if (err) {
                console.log(err);
                res.status(404).send({
                    success: false
                });
            } else {
                res.send({
                    messages: result
                });
            }
        });
    }
});

//delete notify
router.post('/post/delete_notify', function (req, res) {
    Notification.where({_id : req.body.notifyId}).findOneAndRemove(function (err, data) {
        if(err){
            res.send({
                success: false
            });
        }else {
            res.send({
                success:true
            });
        }
    });
});

router.post('/stats', function (req, res) {
    User.count({}, function (err, users) {
        if(err){
            res.send({
                success: false
            });
        }else {
            Post.count({}, function (err, posts) {
                if(err){
                    res.send({
                        success: false
                    });
                }else {
                    Follower.count({}, function (err, followers) {
                        if(err){
                            res.send({
                                success: false
                            });
                        }else {
                            Following.count({}, function (err, following) {
                                if(err){
                                    res.send({
                                        success: false
                                    });
                                }else {
                                    Like.count({}, function (err, likes) {
                                        if(err){
                                            res.send({
                                                success: false
                                            });
                                        }else {
                                            Comment.count({}, function (err, comments) {
                                                if(err){
                                                    res.send({
                                                        success: false
                                                    });
                                                }else {
                                                    commentReply.count({}, function (err, commentReply) {
                                                        if(err){
                                                            res.send({
                                                                success: false
                                                            });
                                                        }else {
                                                            Notification.count({}, function (err, notifications) {
                                                                if(err){
                                                                    res.send({
                                                                        success: false
                                                                    });
                                                                }else {
                                                                    res.send({
                                                                        success: true,
                                                                        users: users,
                                                                        posts: posts,
                                                                        followers: followers,
                                                                        following: following,
                                                                        likes: likes,
                                                                        comments: comments,
                                                                        commentReply: commentReply,
                                                                        notifications: notifications
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;

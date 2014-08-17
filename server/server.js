var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore")
  , $ = require('jquery');

// Prepare database
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('pngrdb');

// Create tables on first run
db.serialize(function() {
	db.run("PRAGMA foreign_keys=ON;", function(err) {
		if(err !== null) console.log("Error: set foreign_keys=ON");
	});
	db.run("CREATE TABLE IF NOT EXISTS users (userid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regdate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, code TEXT, username TEXT, password TEXT, admin BOOLEAN);", function(err) {
		if(err !== null) console.log("Error: Create table 'users': "+err);
	});
	db.run("CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(username);", function(err) {
		if(err !== null) console.log("Error: Create INDEX users: "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS groups (groupid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regdate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, groupname TEXT, open BOOLEAN);", function(err) {
		if(err !== null) console.log("Error: Create table 'groups': "+err);
	});
	db.run("CREATE UNIQUE INDEX IF NOT EXISTS groups_groupname ON groups(groupname);", function(err) {
		if(err !== null) console.log("Error: Create INDEX groups "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS groupjoin (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		if(err !== null) console.log("Error: Create table 'groupjoin': "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS grouppost (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		if(err !== null) console.log("Error: Create table 'grouppost': "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS groupadd (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		if(err !== null) console.log("Error: Create table 'groupadd': "+err);
	});
});

var users = [];

//Server's IP address & port number
app.set("ipaddr", "127.0.0.1");
app.set("port", 8080);

io.on("connection", function(socket) {
	socket.on("testfunc", function(data) {
		console.log("message received from " + data.id);
		//var message = "response successful";
		//io.sockets.socket(data.id).emit("response", {message: message});
	});

	socket.on("joinServer", function(data) {
		// Search for user in database
		db.serialize(function() {
			console.log('checking user credentials');
			db.get("SELECT username, password FROM users WHERE username=$user;", {
				$user: data.username
			}, function(err, row) {
				// Disconnect user if username or password incorrect
				if (!_.isNull(err)) {
					console.log('User joinServer error: '+err);
				} else if(_.isUndefined(row) || _.isNull(row)) {
					console.log('user '+data.username+' not found, disconnecting');
					socket.disconnect(true);
				} else if(data.password !== row.password) {
					console.log('bad credentials for user '+data.username+', disconnecting');
					socket.disconnect(true);
				} else {
					console.log('User '+data.username+' has successfully joined.');
					users.push({id: data.id, username: data.username, groups: new Array()});
					socket.emit('joinServerResponse', {id: data.id, response: 'success'});
				}
			});
		});
		console.log("connection from " + data.id);
	});

	socket.on("joinGroup", function(data) {
		// Check if group exists
		// If group does not exist, create and join it
		// If group exists and is open, join it
		// If group exists and is not open, check if user has permissions
		// If user has permissions, join, otherwise fail
		if(_.indexOf(_.findWhere(users, {id: data.id}).groups, data.group) >= 0) {
			// If the user is already in the group, tell them
			// Not technically an error, but may prevent DOS attack on database
			socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'You are already in the group "'+data.group+'".'});
		} else {
			// Else if the user is not in the group, try to join
			db.serialize(function() {
				console.log('checking if group '+data.group+' exists');
				db.get("SELECT groupname, open FROM groups WHERE groupname=$group;", {
					$group: data.group
				}, function(err, row) {
					if(!_.isNull(err)) {
						console.log("Group exists check error: "+err);
					} else if(_.isUndefined(row) || _.isNull(row)) {
						// If group doesn't exist, create and join it
						db.run("INSERT INTO groups (groupname, open) VALUES($group, $open);", {
							$group: data.group,
							$open: true
						}, function(cerr) {
							if(!_.isNull(cerr)) {
								console.log("Create group error: "+cerr);
							} else {
								_.findWhere(users, {id: data.id}).groups.push(data.group);
								socket.join(data.group);
								console.log("joinGroup: " + data.id + ", " + data.group);
								socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
							}
						});
					} else {
						if(row.open == true) {
							// If group is open, join it
							_.findWhere(users, {id: data.id}).groups.push(data.group);
							socket.join(data.group);
							console.log("joinGroup: " + data.id + ", " + data.group);
							socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
						} else {
							console.log("params: "+data.group+" "+data.user);
							// If group is not open, check if user has permissions
							db.get("SELECT groups.groupname, users.username FROM groups INNER JOIN groupjoin ON groupjoin.groupid=groups.groupid INNER JOIN users ON groupjoin.userid=users.userid WHERE groups.groupname=$group AND users.username=$user;", {
								$group: data.group,
								$user: _.findWhere(users, {id: data.id}).username
							}, function(verr, vrow) {
								console.log('vrow: '+vrow);
								if(!_.isNull(verr)) {
									console.log("Group join error: "+verr);
								} else if(_.isUndefined(vrow) || _.isNull(vrow)) {
									// User does not have permissions to join group
									socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'You do not have permission to join the group "'+data.group+'". Please contact an Admin.'});
								} else {
									// If user has permissions, join group
									_.findWhere(users, {id: data.id}).groups.push(data.group);
									socket.join(data.group);
									console.log("joinGroup: " + data.id + ", " + data.group);
									socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
								}
							});
						}
					}
				});
			});
		}
	});

	socket.on('sendMsg', function(data) {
		console.log("message from " + data.id + " to " + data.groups.toString());
		if(_.isUndefined(data.subject) || _.isEmpty(data.subject)) {
			socket.emit('msgResponse', {id: data.id, response: 'Message subject cannot be empty.'});
		} else if(_.isUndefined(data.message) || _.isEmpty(data.message)) {
			socket.emit('msgResponse', {id: data.id, response: 'Message body cannot be empty.'});
		} else {
			for (var g in data.groups) {
				// Fail if message is received with group that user is not in
				if(_.indexOf(_.findWhere(users, {id: data.id}).groups, data.groups[g]) < 0) {
					socket.emit('msgResponse', {id: data.id, response: 'You are not in group '+data.groups[g]});
				} else {
					db.get("SELECT groups.groupname, users.username FROM groups INNER JOIN grouppost ON grouppost.groupid=groups.groupid INNER JOIN users ON grouppost.userid=users.userid WHERE groups.groupname=$group AND users.username=$user;", {
						$group: data.groups[g],
						$user: _.findWhere(users, {id: data.id}).username
					}, function(err, row) {
						if(!_.isNull(err)) {
							console.log("sendMsg SQL error: "+err);
							socket.emit('msgResponse', {id: data.id, response: 'Server error.'});
						} else if(_.isUndefined(row) || _.isNull(row)) {
							console.log("sendMsg error: insufficient permissions");
							socket.emit('msgResponse', {id: data.id, response: 'Insufficient permissions for group '+data.groups[g]+'.'});
						} else {
							console.log("sending message from " + data.id + " to " + data.groups[g]);
							io.sockets.in(data.groups[g]).emit('newMsg', {id: data.id, user: _.findWhere(users, {id: data.id}).username, group: data.groups[g], time: Date.now().toString(), subject: data.subject, message: data.message});
							socket.emit('msgResponse', {id: data.id, response: 'success'});
						}
					});
				}
			}
		}

	});

	socket.on("register", function(data) {
		var accesscode = "actest";

		if(data.code === accesscode) {
			// Insert user into database
			db.run("INSERT INTO users (code, username, password, admin) VALUES ($code, $user, $pass, $admin);", {
				$user: data.user,
				$pass: data.pass,
				$code: data.code,
				$admin: false
			}, function(err) {
				if (!_.isNull(err)) {
					console.log("SQL 'register' error: "+err);
				} else {
					// Respond to client
					socket.emit("regresponse", {id: data.id, response: "success"});
				}
			});

		} else {
			socket.emit("regresponse", {id: data.id, response: "Invalid access code."});
		}
	})
});

//Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
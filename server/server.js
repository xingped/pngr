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
	db.run("PRAGMA foreign_keys=ON;");
	db.run("CREATE TABLE IF NOT EXISTS users (userid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regdate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, code TEXT, username TEXT, password TEXT, admin BOOLEAN);", function(err) {
		console.log("Error: Create table 'users': "+err);
	});
	db.run("CREATE UNIQUE INDEX users_username ON users(username);");
	db.run("CREATE TABLE IF NOT EXISTS groups (groupid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regdate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, groupname TEXT, open BOOLEAN);", function(err) {
		console.log("Error: Create table 'groups': "+err);
	});
	db.run("CREATE UNIQUE INDEX groups_groupname ON groups(groupname);");
	db.run("CREATE TABLE IF NOT EXISTS groupjoin (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		console.log("Error: Create table 'groupjoin': "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS grouppost (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		console.log("Error: Create table 'grouppost': "+err);
	});
	db.run("CREATE TABLE IF NOT EXISTS groupadd (groupid INTEGER, userid INTEGER, FOREIGN KEY(groupid) REFERENCES groups(groupid), FOREIGN KEY(userid) REFERENCES users(userid));", function(err) {
		console.log("Error: Create table 'groupadd': "+err);
	});
});

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
				if (err !== null) {
					console.log('User joinServer error: '+err);
				} else if(row === undefined || row === null) {
					console.log('user '+data.username+' not found, disconnecting');
					socket.disconnect(true);
				} else if(data.password !== row.password) {
					console.log('bad credentials for user '+data.username+', disconnecting');
					socket.disconnect(true);
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
		var exists = false;
		var open = false;
		db.serialize(function() {
			console.log('checking if group '+data.group+' exists');
			db.get("SELECT groupname, open FROM groups WHERE groupname=$group;", {
				$group: data.group
			}, function(err, row) {
				if(err !== null) {
					console.log("Group exists check error: "+err);
				} else if(row === undefined || row === null) {
					// If group doesn't exist, create and join it
					db.run("INSERT INTO groups (groupname, open) VALUES($group, $open);", {
						$group: data.group,
						$open: true
					}, function(jerr) {
						if(cerr !== null) {
							socket.join(data.group);
							console.log("joinGroup: " + data.id + ", " + data.group);
							socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
						} else {
							console.log("Create group error: "+cerr);
						}
					});
				} else {
					if(row.open == true) {
						// If group is open, join it
						socket.join(data.group);
						console.log("joinGroup: " + data.id + ", " + data.group);
						socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
					} else {
						console.log("params: "+data.group+" "+data.user);
						// If group is not open, check if user has permissions
						db.get("SELECT groups.groupname, users.username FROM groups INNER JOIN groupjoin ON groupjoin.groupid=groups.groupid INNER JOIN users ON groupjoin.userid=users.userid WHERE groups.groupname=$group AND users.username=$user;", {
							$group: data.group,
							$user: data.user
						}, function(verr, vrow) {
							console.log('vrow: '+vrow);
							if(verr !== null) {
								console.log("Group join error: "+verr);
							} else if(vrow !== undefined && vrow !== null) {
								// If user has permissions, join group, otherwise fail
								socket.join(data.group);
								console.log("joinGroup: " + data.id + ", " + data.group);
								socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
							} else {
								socket.emit('joinGroupResponse', {id: data.id, group: data.group, 
									result: 'You do not have permission to join this group. Please contact an Admin.'});
							}
						});
					}
				}
			});
		});
	});

	socket.on('sendMsg', function(data) {
		console.log("message from " + data.id + " to " + data.groups.toString());
		for (var g in data.groups) {
			console.log("sending message from " + data.id + " to " + data.groups[g]);
			io.sockets.in(data.groups[g]).emit('newMsg', {id: data.id, user: data.user, group: data.groups[g], time: Date.now().toString(), subject: data.subject, message: data.message});
		}
		socket.emit('msgResponse', {id: data.id, response: 'success'});
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
				if (err !== null) {
					// Respond to client
					socket.emit("regresponse", {id: data.id, response: "success"});
				} else {
					console.log("SQL 'register' error: "+err);
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

/*var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydb');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS lorem (info TEXT)");

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
      console.log(row.id + ": " + row.info);
  });
});

db.close();*/
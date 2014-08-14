var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore")
  , $ = require('jquery');

// Prepare database
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('pngrdb');

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
			db.get("SELECT rowid, username, password FROM users WHERE username=$user AND password=$pass;", {
				$user: data.username,
				$pass: data.password
			}, function(err, row) {
				// Disconnect user if username or password incorrect
				if(row === undefined || row === null) {
					console.log('bad credentials, disconnecting');
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
			db.run("CREATE TABLE IF NOT EXISTS groups ([group] TEXT, open BOOLEAN);", function(err) {
				console.log('Error: '+err);
			});
			console.log('checking if group '+data.group+' exists');
			db.get("SELECT 'group', open FROM groups WHERE [group]=$group;", {
				$group: data.group
			}, function(err, row) {
				if(row === undefined || row === null) {
					// If group doesn't exist, create and join it
					db.run("INSERT INTO groups VALUES($group, $open);", {
						$group: data.group,
						$open: true
					});
					socket.join(data.group);
					console.log("joinGroup: " + data.id + ", " + data.group);
					socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
				} else {
					if(row.open == true) {
						// If group is open, join it
						socket.join(data.group);
						console.log("joinGroup: " + data.id + ", " + data.group);
						socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
					} else {
						// If group is not open, check if user has permissions
						db.get("SELECT 'group', user FROM groupaccess WHERE [group]=$group AND user=$user;", {
							$group: data.group,
							$user: data.user
						}, function(verr, vrow) {
							if(vrow !== undefined && vrow !== null) {
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
		//var groups = data.groups.toString().split(',');
		//console.log("groups: " + groups.toString());
		for (var g in data.groups) {
			console.log("sending message from " + data.id + " to " + data.groups[g]);
			io.sockets.in(data.groups[g]).emit('newMsg', {id: data.id, group: data.groups[g], time: Date.now().toString(), subject: data.subject, message: data.message});
		}
		socket.emit('msgResponse', {id: data.id, response: 'success'});
	});

	socket.on("register", function(data) {
		var accesscode = "actest";

		if(data.code === accesscode) {
			// Insert user into database
			db.serialize(function() {
				db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT, code TEXT);");

				db.run("INSERT INTO users VALUES ($user, $pass, $code);", {
					$user: data.user,
					$pass: data.pass,
					$code: data.code
				});
			});

			// Respond to client
			socket.emit("regresponse", {id: data.id, response: "success"});
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
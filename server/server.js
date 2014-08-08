var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore")
  , $ = require('jquery');

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
		console.log("connection from " + data.id);
	});

	socket.on("joinGroup", function(data) {
		
		/****** TODO: validate if user is allowed to join group **********/

		socket.join(data.group);
		console.log("joinGroup: " + data.id + ", " + data.group);
		socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
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
});

//Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});

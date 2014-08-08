var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore");

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
		/* also check and respond if user is already in group */

		socket.join(data.group);
		console.log("joinGroup: " + data.id + ", " + data.group);
		socket.emit('joinGroupResponse', {id: data.id, group: data.group, result: 'true'});
	});
});

//Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});

var gui = require('nw.gui');
var fs = require("fs");
var accounts = new Array();

function ChatServer(username, password, server) {
	var self = this;
	this.username = username;
	this.password = password;
	this.server = server;
	this.sessionId = '';
}

ChatServer.prototype.connect = function() {
	this.socket = io.connect(this.server);

	this.socket.on('connect', function() {
		self.sessionId = self.socket.socket.sessionid;
		self.socket.emit('joinServer', {id: self.sessionId, username: self.username, password: self.password});
	});

	this.socket.on('joinServerResponse', function() {
		console.log(self.sessionId);
		$.each(self.groups, function(i, group) {
			self.socket.emit('joinGroup', {id: self.sessionId, user: self.username, group: group});
		});
	});

	// Server response from trying to join group
	this.socket.on('joinGroupResponse', function(data) {
		if(data.result != 'true') {
			// Display popup with reason for group join failure
			alert(data.result);
		} else if(data.result == 'true') {
			console.log('group index: ' + self.groups.indexOf(data.group));
			
			if(self.groups.indexOf(data.group) < 0) {
				// If the group is not already in the list, it's not in the JSON file and we need to put it there
				var fileData = fs.readFileSync('test.txt');
				var jsonData = $.parseJSON(fileData);
				
				jsonData.accounts[accounts.indexOf(self)].groups.push({"name": data.group});
				self.groups.push(data.group);

				fs.writeFileSync('test.txt', JSON.stringify(jsonData, null, '\t'));
				console.log('joinGroup ' + data.group + ' success, added');
			} else {
				// If the group is in the list, it's in the file, continue as normal
				console.log('joinGroup ' + data.group + ' success, no add');
			}
		}
	});
};

function init() {
/****
  Initialize node-webkit gui
****/
	var win = gui.Window.get();
	win.resizeTo(500, 600);
}

$(document).on('ready', init);

function serverConnect(serverId)
{
	accounts[serverId].connect();
}

function openAcntList()
{
	var acntlistwin = gui.Window.get(
		window.open('accountlist.html')
	);
	acntlistwin.resizeTo(400, 400);
}
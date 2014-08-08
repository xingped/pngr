var gui = require('nw.gui');
var fs = require("fs");
var servers = new Array();

function ChatServer(name, url, groups) {
	var self = this;
	this.name = name;
	this.url = url;
	this.sessionId = '';
	this.groups = groups;

	this.socket = io.connect(url);
	this.connected = false;
	this.disabled = false;
	
	this.socket.on('connect', function() {
		self.connected = true;
		self.sessionId = self.socket.socket.sessionid;
		self.socket.emit('joinServer', {id: self.sessionId});
		
		$.each(self.groups, function(i, group) {
			self.socket.emit('joinGroup', {id: self.sessionId, group: group});
		});

		console.log(self.sessionId);
	});

	// Server response from trying to join group
	this.socket.on('joinGroupResponse', function(data) {
		if(data.result != 'true') {
			// Display popup with reason for group join failure
			var w = gui.Window.get(window.open());
			w.resizeTo(100, 200);
			wHtml = '<html><body><center><h4>' + data.result + '</h4><br />';
			wHtml += '<button class="btn btn-default" onclick="window.close();">OK</button></center></body></html>';
			w.html(wHtml);
		} else if(data.result == 'true') {
			console.log('group index: ' + self.groups.indexOf(data.group));
			
			if(self.groups.indexOf(data.group) < 0) {
				// If the group is not already in the list, it's not in the JSON file and we need to put it there
				var fileData = fs.readFileSync('test.txt');
				var jsonData = $.parseJSON(fileData);
				
				jsonData.servers[servers.indexOf(self)].groups.push({"name": data.group});

				fs.writeFileSync('test.txt', JSON.stringify(jsonData, null, '\t'));
				console.log('joinGroup ' + data.group + ' success, added');
			} else {
				// If the group is in the list, it's in the file, continue as normal
				console.log('joinGroup ' + data.group + ' success, no add');
			}
		}
	});

	this.socket.on('newMsg', function(data) {
		var msgHtml = '';
		msgHtml += '<div class="panel-group" id="' + data.group + data.time + 'group">';
		msgHtml += '	<div class="panel panel-primary">';
		msgHtml += '		<div class="panel-heading" data-toggle="collapse" data-target="#' + data.group + data.time + 'msg">';
		msgHtml += '			<h4 class="panel-title pull-left">' + data.subject + '</h4>';
		msgHtml += '			<button class="btn btn-default btn-xs pull-right">&#8203;<span class="glyphicon glyphicon-trash"></span></button>';
		msgHtml += '		<div class="clearfix"></div>';
		msgHtml += '	</div>';
		msgHtml += '	<div id="' + data.group + data.time + 'msg" class="panel-collapse collapse in">';
		msgHtml += '			<div class="panel-body">' + data.message + '</div>';
		msgHtml += '		</div>';
		msgHtml += '		<div class="panel-footer">';
		msgHtml += '			<small>' + data.id + ' to ' + data.group + '</small>';
		msgHtml += '		</div>';
		msgHtml += '	</div>';
		msgHtml += '</div>';
		

		$('#messages').prepend(msgHtml);
	});

	/*socket.on('response', function(data) {
		//$("#response").append(url+": "+data.message+"<br />");
		
		var icon = "img/desktop-notify.png";
		var title = url;
		var content = data.message;
		window.LOCAL_NW.desktopNotifications.notify(icon, title, content, function(){
			$('#status').text('Clicked on '+title);
			$('#status').fadeIn('fast',function(){
				setTimeout(function(){
					$('#status').fadeOut('fast');
				},1800);
			});
		});
	});*/
}

ChatServer.prototype.connect = function(group) {
	this.socket = io.connect(this.url);
};

ChatServer.prototype.joinGroup = function(group) {
	this.socket.emit('joinGroup', {id: this.sessionId, group: group});
	console.log('joinGroup: ' + this.sessionId + ' ' + group);
};

function init() {
/****
  Initialize node-webkit gui
****/
	var win = gui.Window.get();
	win.resizeTo(320, 600);
	var tray = new gui.Tray({title: 'Tray Title', icon: 'img/icon.png'});
	
	var menu = new gui.Menu();
	menu.append(new gui.MenuItem({ type: 'checkbox', label: 'box1' }));
	menu.append(new gui.MenuItem({
		label: 'Exit',
		click: function() {
			gui.App.quit();
		}
	}));
	tray.menu = menu;
	
	tray.on('click', function() {
		win.show();
	});

/****
  Load servers from file. Servers connect on creation.
****/
	var data = fs.readFileSync('test.txt');
	var obj = $.parseJSON(data);
	
	$.each(obj.servers, function(i, item) {
		var groups = new Array();
		$.each(item.groups, function(g, group) {
			//console.log(group.name);
			groups.push(group.name);
		});

		servers.push(new ChatServer(item.name, item.address, groups));
		
	});

}

$(document).on('ready', init);

function openSendMsg()
{
	var msgwin = gui.Window.get(
		window.open('message.html')
	);
	msgwin.resizeTo(400, 600);
}

function openAcntList()
{
	var acntlistwin = gui.Window.get(
		window.open('accountlist.html')
	);
	acntlistwin.resizeTo(400, 400);
}

function openAcnt()
{
	var acntwin = gui.Window.get(
		window.open('account.html')
	);
	acntwin.resizeTo(300, 350);
}

function openStngs()
{
	var stngwin = gui.Window.get(
		window.open('settings.html')
	);
	stngwin.resizeTo(400, 400);
}

function openJoin()
{
	var joinwin = gui.Window.get(
		window.open('join.html')
	);
	joinwin.resizeTo(300, 230);
}
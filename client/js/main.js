var gui = require('nw.gui');
var servers = new Array();

function ChatServer(url, groups) {
	var self = this;
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
	this.groups.push(group);
	console.log(this.sessionId);
	//this.socket.emit('joinGroup', {id: this.sessionId, group: group});
	//console.log('[emit: joinGroup] - "' + group + '"');
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
	var fs = require("fs");
	var fileName = "test.txt";

	var data = fs.readFileSync(fileName, 'utf8');
	var obj = $.parseJSON(data);
	
	$.each(obj.servers, function(i, item) {
		var groups = new Array();
		$.each(item.groups, function(g, group) {
			//console.log(group.name);
			groups.push(group.name);
		});

		servers.push(new ChatServer(item.address, groups));
		
	});

}

$(document).on('ready', init);

function openSendMsg()
{
	var msgwin = gui.Window.get(
		window.open('message.html')
	);
	msgwin.resizeTo(400, 551);
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
	joinwin.resizeTo(300, 200);
}
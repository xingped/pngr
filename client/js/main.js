var gui = require('nw.gui');
var servers = new Array();

function ChatServer(url) {
	var self = this;
	this.url = url;
	this.sessionId = '';
	this.groups = new Array();

	this.socket = io.connect(this.url);
	this.connected = false;
	this.disabled = false;
	
	this.socket.on('connect', function() {
		self.connected = true;
		self.sessionId = self.socket.socket.sessionid;
		//$('#output').append(url+" SID: "+sessionId+"<br />");
		self.socket.emit('testfunc', {id: self.sessionId});
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
  Load servers from file
****/
	var fs = require("fs");
	var fileName = "test.txt";

	var data = fs.readFileSync(fileName, 'utf8');
	var obj = $.parseJSON(data);
	$.each(obj.servers, function(i, item) {
		//console.log(item.name + " " + item.address);
		servers.push(new ChatServer(item.address));
		
		$.each(item.groups, function(g, group) {
			//console.log(group.name);
			servers[i].groups.push(group.name);
		});
	});

/****
  Connect to servers
****/
	// Servers are connected when read from file

/****

****/

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
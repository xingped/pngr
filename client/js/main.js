var gui = require('nw.gui');
var servers = new Array();

function ChatServer(url) {
	var self = this;
	this.url = url;
	this.sessionId = '';
	this.groups = new Array();

	this.socket = io.connect(url);
	
	this.socket.on('connect', function() {
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
  Connect to servers
****/
	servers.push(new ChatServer('127.0.0.1:8080'));
	servers[0].groups.push('Sample1');
	servers[0].groups.push('Sample2');
	servers.push(new ChatServer('127.0.0.1:123456789'));
	servers[1].groups.push('Sample3');
	servers[1].groups.push('Sample4');
}

$(document).on('ready', init);

function openSendMsg()
{
	var msgwin = gui.Window.get(
		window.open('message.html')
	);
	msgwin.resizeTo(400, 551);
}

function openAcnts()
{
	var acntwin = gui.Window.get(
		window.open('accounts.html')
	);
	acntwin.resizeTo(400, 400);
}

function openNewAcnt()
{
	var acntwin = gui.Window.get(
		window.open('newaccount.html')
	);
	acntwin.resizeTo(300, 300);
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
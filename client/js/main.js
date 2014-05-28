function ChatServer(url) {
	var socket = io.connect(url);
	var sessionId = '';
	
	socket.on('connect', function() {
		sessionId = socket.socket.sessionid;
		$('#output').append(url+" SID: "+sessionId+"<br />");
		socket.emit('testfunc', {id: sessionId});
	});
	
	socket.on('response', function(data) {
		$("#response").append(url+": "+data.message+"<br />");
		
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
	});
}

function init() {
/****
  Initialize node-webkit gui
****/
	var gui = require('nw.gui');
	var win = gui.Window.get();
	win.resizeTo(300, 600);
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
	var servers = new Array();
	servers.push(new ChatServer('192.168.1.11:8080'));
	//servers.push(new ChatServer('192.168.1.9:8080'));
}

$(document).on('ready', init);

			
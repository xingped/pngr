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
	var servers = new Array();
	servers.push(new ChatServer('192.168.1.11:8080'));
	//servers.push(new ChatServer('192.168.1.9:8080'));
}

$(document).on('ready', init);
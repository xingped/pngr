var gui = require('nw.gui');
var newacntwin;

function openNewAcnt()
{
	newacntwin = gui.Window.get(
		window.open('newaccount.html')
	);
	newacntwin.resizeTo(300, 300);
}

$(document).on('ready', function() {
	window.opener.socket.emit('testfunc', {id: window.opener.sessionId});
	/*var socket = io.connect('127.0.0.1:8080');
	var sessionId = '';

	socket.on('connect', function() {
		sessionId = socket.socket.sessionid;
		//$('#output').append(url+" SID: "+sessionId+"<br />");
		socket.emit('testfunc', {id: sessionId});
		console.log(sessionId);
	});*/
});
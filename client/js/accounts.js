var gui = require('nw.gui');

function openNewAcnt()
{
	var acntwin = gui.Window.get(
		window.open('newaccount.html')
	);
	acntwin.resizeTo(300, 300);
}
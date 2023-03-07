let end, interval;
const main = document.querySelector('main'), clock = document.getElementById('Clock'), msgEl = document.getElementById('Messages');
function time(d = new Date()) { const t = d.toLocaleTimeString(); return t.slice(0, t.indexOf(':') + 3) + t.slice(-2); }
new BroadcastChannel('coh').onmessage = ({ data }) => {
	console.log('message', data);
	if (end = data.timer || data.start) {
		document.getElementById('End').textContent = time(end);
		main.classList.add('timer');
		interval = setInterval(countdown, 250); countdown();
	}
	if (data.type) {
		document.querySelector('.lower.right').textContent = data.type;
		main.className = ''; main.classList.add(data.type.replace(/-|\s/g, ''));
	}
	if (data.chair) { document.getElementById('Chair').textContent = data.chair; }
	(window.obsstudio?.setCurrentScene || console.log.bind(console, 'setCurrentScene'))(end ? 'Muted' : 'Main')
};
function countdown() {
	const diff = end - new Date(), minutes = Math.floor(diff / 60000); let remaining;
	if (diff <= 2000) { clearInterval(interval); remaining = 'just a minute'; } // for less than two seconds, don't show "1 seconds" or "0 seconds"
	else if (minutes > 0) { remaining = minutes + ' minute' + (minutes > 1 ? 's' : ''); }
	else { remaining = Math.floor((diff % 60000) / 1000) + ' seconds'; }
	document.getElementById('Remaining').textContent = remaining;
};

document.getElementById('Date').textContent = new Date().toLocaleDateString();
(function updateClock() { clock.textContent = time(); requestAnimationFrame(updateClock); })();
// messages
	import messages from './messages.mjs';
	const qrCfg = {
		// https://github.com/kozakdenys/qr-code-styling
		// https://qr-code-styling.com
		type: 'canvas', width: 300, height: 300, margin: 10,
		image: 'qrCenter.svg', imageOptions: { margin: 10 },
		dotsOptions: { color: '#FFF', type: 'rounded' },
		backgroundOptions: { color: '#00000060' },
	};
	messages.forEach(o => {
		msgEl.insertAdjacentHTML('beforeend', '<div class="message">'
			+ `<h1>${o.header}</h1>`
			+ (o.img ? `<img src="${o.img}" class="messageImg">` : '')
			+ (o.url ? `<a href="${o.url}">${o.url}</a>` : '')
			+ `<p>${o.description}</p>`
		+ '</div>');
		if (o.url) {
			new QRCodeStyling({ ...qrCfg, data: o.url }).append(msgEl.lastElementChild);
			msgEl.lastElementChild.lastElementChild.classList.add('messageImg');
		}
	});
	msgEl.removeAttribute('hidden');
	function rotateMsgs() {
		const current = document.querySelector('.message.current') || document.querySelector('.message:last-child'),
			next = current.nextElementSibling || current.parentElement.firstElementChild;
		current.classList.remove('current');
		next.classList.add('current');
	}
	setInterval(rotateMsgs, 20000); rotateMsgs();
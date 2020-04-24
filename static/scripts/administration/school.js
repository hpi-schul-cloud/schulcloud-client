function transformToBase64(imageSrc) {
	const img = new Image();
	const canvas = document.querySelector('#logo-canvas');
	const ctx = canvas.getContext('2d');
	let scalingFactor;
	img.onload = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (img.width < img.height) {
			scalingFactor = img.height / canvas.height;
		} else {
			scalingFactor = img.width / canvas.width;
		}
		const dx = canvas.width / 2 - img.width / scalingFactor / 2;
		const dy = canvas.height / 2 - img.height / scalingFactor / 2;
		const dw = img.width / scalingFactor;
		const dh = img.height / scalingFactor;
		ctx.drawImage(img, dx, dy, dw, dh);
		document.getElementsByName('logo_dataUrl')[0].value = canvas.toDataURL('image/png');
		document.querySelector('#preview-logo').src = canvas.toDataURL('image/png');
		document.querySelector('#logo-filename').innerHTML = 'Datei ausgewählt';
	};
	img.src = imageSrc;
}

function loadFile() {
	const file = document.querySelector('#logo-input').files[0];
	const reader = new FileReader();
	reader.addEventListener('load', () => {
		transformToBase64(reader.result);
	}, false);
	if (file) {
		reader.readAsDataURL(file);
	}
}

document.querySelector('#logo-input')
	.addEventListener('change', loadFile, false);

// hide/show Messenger sub options
const messengerInput = document.querySelector('#messenger');
const messengerSubOptions = document.querySelector('#messenger-sub-options');
if (messengerInput && messengerSubOptions) {
	const setMessengerSubOptionsViability = (visible) => {
		if (visible) {
			messengerSubOptions.classList.remove('hidden');
		} else {
			messengerSubOptions.classList.add('hidden');
		}
	};

	setMessengerSubOptionsViability(messengerInput.checked);
	messengerInput.addEventListener('change', (event) => {
		setMessengerSubOptionsViability(event.target.checked);
	});
}

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
		document.querySelector('#logo-filename').innerHTML = $t('administration.school.text.fileSelected');
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

const MAX_FILE_SIZE_MB = 4;

const toBase64 = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result);
	reader.onerror = (error) => reject(error);
});

const loadPolicyFile = async () => {
	const file = document.querySelector('#policy-input').files[0];
	const base64file = await toBase64(file);

	const reader = new FileReader();
	reader.addEventListener('load', (evt) => {
		if (!file.type.match('application/pdf')) {
			$.showNotification($t('administration.school.text.onlyPDFSupport'), 'danger', true);
			document.querySelector('#policy-input').value = '';
			document.querySelector('#policy-file-name').innerHTML = '';
			document.querySelector('#policy-file-data').value = '';
			document.querySelector('#policy-file-logo').style.display = 'none';
			return;
		}
		const filesize = ((file.size / 1024) / 1024).toFixed(4); // MB

		if (filesize > MAX_FILE_SIZE_MB) {
			$.showNotification(
				$t('administration.school.text.fileTooLarge', { size: MAX_FILE_SIZE_MB }), 'danger', true,
			);
			return;
		}
		document.querySelector('#policy-file-name').innerHTML = `${file.name} (${filesize}MB)`;
		document.querySelector('#policy-file-logo').style.display = 'inline';
		document.querySelector('#policy-file-data').value = base64file;
	}, false);
	if (file) {
		reader.readAsDataURL(file);
	}
};

document.querySelector('#policy-input')
	.addEventListener('change', loadPolicyFile, false);

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

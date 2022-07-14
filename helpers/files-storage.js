const apiFilesStorage = require('../api-files-storage');

const getThumbnailIcon = (filename) => {
	const thumbs = {
		default: '/images/thumbs/default.png',
		psd: '/images/thumbs/psds.png',
		txt: '/images/thumbs/txts.png',
		doc: '/images/thumbs/docs.png',
		png: '/images/thumbs/pngs.png',
		mp4: '/images/thumbs/mp4s.png',
		mp3: '/images/thumbs/mp3s.png',
		aac: '/images/thumbs/aacs.png',
		avi: '/images/thumbs/avis.png',
		gif: '/images/thumbs/gifs.png',
		html: '/images/thumbs/htmls.png',
		js: '/images/thumbs/jss.png',
		mov: '/images/thumbs/movs.png',
		xls: '/images/thumbs/xlss.png',
		xlsx: '/images/thumbs/xlss.png',
		pdf: '/images/thumbs/pdfs.png',
		flac: '/images/thumbs/flacs.png',
		jpg: '/images/thumbs/jpgs.png',
		jpeg: '/images/thumbs/jpgs.png',
		docx: '/images/thumbs/docs.png',
		ai: '/images/thumbs/ais.png',
		tiff: '/images/thumbs/tiffs.png',
	};

	const ending = filename.split('.').pop();
	const thumbnail = thumbs[ending.toLowerCase()] || thumbs.default;

	return thumbnail;
};

async function filesStorageInit(schoolId, parentId, parentType, req, readonly = false) {
	let files = [];

	if (parentId) {
		const result = await apiFilesStorage(req, { version: 'v3' })
			.get(`/file/list/${schoolId}/${parentType}/${parentId}`);
		if (result && result.data) {
			files = result.data;
		}
	}

	const filesStorage = {
		schoolId,
		parentId,
		parentType,
		files,
		readonly,
	};
	return { filesStorage };
}

module.exports = {
	getThumbnailIcon,
	filesStorageInit,
};

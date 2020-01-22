/*
 * One Controller per layout view
 */

const url = require('url');
const rp = require('request-promise');
const express = require('express');
const multer = require('multer');
const shortid = require('shortid');
const _ = require('lodash');

const upload = multer({ storage: multer.memoryStorage() });

const api = require('../api');
const authHelper = require('../helpers/authentication');
const logger = require('../helpers/logger');

const router = express.Router();

const filterOptions = [
	{ key: 'pics', label: 'Bilder' },
	{ key: 'videos', label: 'Videos' },
	{ key: 'pdfs', label: 'PDF Dokumente' },
	{ key: 'msoffice', label: 'Word/Excel/PowerPoint' },
];

const filterQueries = {
	pics: { $regex: 'image' },
	videos: { $regex: 'video' },
	pdfs: { $regex: 'pdf' },
	msoffice: { $regex: 'officedocument|msword|ms-excel|ms-powerpoint' },
};

const addThumbnails = (file) => {
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

	if (!file.isDirectoy) {
		const ending = file.name.split('.').pop();
		file.thumbnail = thumbs[ending.toLowerCase()] || thumbs.default;
	}
	return file;
};


/**
 * sends a signedUrl request to the server
 * @param {*} data, contains the path for the requested file
 */
const requestSignedUrl = (req, data) => api(req).post('/fileStorage/signedUrl', {
	json: data,
});

const retrieveSignedUrl = (req, data) => api(req).get('/fileStorage/signedUrl', {
	qs: data,
});

/**
 * handles query params for file requests
 */
const changeQueryParams = (originalUrl, params = {}, pathname = '') => {
	const urlParts = url.parse(originalUrl, true);

	Object.keys(params).forEach((param) => {
		urlParts.query[param] = params[param];
	});

	if (pathname) {
		urlParts.pathname = pathname;
	}

	delete urlParts.search;
	return url.format(urlParts);
};

/**
 * generates the displayed breadcrumbs on the actual file page
 */
const getBreadcrumbs = (req, dirId, breadcrumbs = []) => api(req).get(`/files/${dirId}`)
	.then((directory) => {
		if (directory.parent) {
			return getBreadcrumbs(req, directory.parent, breadcrumbs)
				.then((deepBreadcrumbs) => {
					deepBreadcrumbs.push({
						label: directory.name,
						id: directory._id,
					});

					return Promise.resolve(deepBreadcrumbs);
				});
		}

		breadcrumbs.push({
			label: directory.name,
			id: directory._id,
		});

		return Promise.resolve(breadcrumbs);
	});


/**
 * check whether given files can be opened in LibreOffice
 */
const checkIfOfficeFiles = (files) => {
	if (!process.env.LIBRE_OFFICE_CLIENT_URL) {
		logger.error('LibreOffice env is currently not defined.');
		return files;
	}
	const officeFileTypes = [
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
		'application/vnd.ms-powerpoint', // .ppt
		'application/vnd.ms-excel', // .xlx
		'application/vnd.ms-word', // .doc
		'application/vnd.oasis.opendocument.text', // .odt
		'text/plain', // .txt
		'application/msword', // .doc
	];

	return files.map(f => ({
		isOfficeFile: officeFileTypes.indexOf(f.type) > -1,
		...f,
	}));
};

/**
 * generates the correct file's or directory's storage context for further requests
 */
const getStorageContext = (req, res) => {
	const key = Object.keys(req.params).find(k => ['courseId', 'teamId', 'classId'].indexOf(k) > -1);
	return req.params[key] || res.locals.currentUser._id;
};

/**
 * fetches all files and directories for a given storageContext
 */
const FileGetter = (req, res, next) => {
	const owner = getStorageContext(req, res);
	const userId = res.locals.currentUser._id;
	const { params: { folderId, subFolderId } } = req;
	const parent = subFolderId || folderId;
	const promises = [
		api(req).get('/roles', { qs: { name: 'student' } }),
		api(req).get('/fileStorage', {
			qs: { owner, parent },
		}),
	];

	return Promise.all(promises)
		.then(([role, result]) => {
			if (!Array.isArray(result) && result.code === 403) {
				res.locals.files = { files: [], directories: [] };
				logger.warn(result);
				next();
				return;
			}

			const files = result.filter(f => f).map((file) => {
				if (file.permissions[0].refId === userId) {
					Object.assign(file, {
						userIsOwner: true,
					});
				}
				return file;
			});

			res.locals.files = {
				files: checkIfOfficeFiles(files.filter(f => !f.isDirectory)),
				directories: files.filter(f => f.isDirectory),
			};
			next();
		}).catch((err) => {
			next(err);
		});
};

/**
 * fetches all sub-scopes (courses, classes etc.) for a given user and super-scope
 */
const getScopeDirs = (req, res, scope) => {
	const currentUserId = String(res.locals.currentUser._id);
	let qs = {
		$or: [
			{ userIds: currentUserId },
			{ teacherIds: currentUserId },
			{ substitutionIds: currentUserId },
		],
	};
	if (scope === 'teams') {
		qs = {
			userIds: {
				$elemMatch: { userId: currentUserId },
			},
		};
	}
	return api(req).get(`/${scope}/`, { qs }).then(records => records.data.map(record => Object.assign(record, {
		url: `/files/${scope}/${record._id}`,
	})));
};

/**
 * generates a directory tree from a path recursively
 * @param rootPath
 */
const getDirectoryTree = (set, directory) => {
	const children = set.filter(dir => dir.parent && dir.parent === directory._id);

	if (children.length) {
		directory.children = children.map(child => getDirectoryTree(set, child));
	}

	return directory;
};

/**
 * register a new filePermission for the given user for the given file
 * @param userId {String} - the user which should be granted permission
 * @param fileId {String} - the file for which a new permission should be created
 * @param shareToken {String} - a token for verify enabled sharing
 */
const registerSharedPermission = (userId, fileId, shareToken, req) => api(req)
	// check whether sharing is enabled for given file
	.get(`/files/${fileId}`, { qs: { shareToken } }).then((file) => {
		if (!file) {
			// owner permits sharing of given file
			throw new Error('Zu dieser Datei haben Sie keinen Zugriff!');
		}
		const permission = file.permissions.find(perm => perm.refId.toString() === userId);

		if (!permission) {
			file.permissions.push({
				refId: userId,
				refPermModel: 'user',
				read: true,
				write: false,
				delete: false,
				create: false,
			});

			return api(req).patch(`/files/${fileId}`, { json: file });
		}
		return Promise.resolve(file);
	});

/**
 * generates the correct LibreOffice url for (only) opening office-files
 * @param {*} fileId, the id of the file which has to be opened in LibreOffice
 * @param {*} accessToken, the auth token for the wopi-host later on
 * see https://wopi.readthedocs.io/en/latest/overview.html#integration-process for further details
 */
const getLibreOfficeUrl = (fileId, accessToken) => {
	if (!process.env.LIBRE_OFFICE_CLIENT_URL) {
		logger.error('LibreOffice env is currently not defined.');
		return '';
	}

	// in the form like: http://ecs-80-158-4-11.reverse.open-telekom-cloud.com:9980
	const libreOfficeBaseUrl = process.env.LIBRE_OFFICE_CLIENT_URL;
	const wopiRestUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030';
	const wopiSrc = `${wopiRestUrl}/wopi/files/${fileId}?access_token=${accessToken}`;
	return `${libreOfficeBaseUrl}/loleaflet/dist/loleaflet.html?WOPISrc=${wopiSrc}`;
};


// secure routes
router.use(authHelper.authChecker);

const getSignedUrl = (req, res, next) => {
	const {
		type,
		parent,
		action = 'putObject',
		filename,
	} = req.body;

	const data = {
		parent,
		fileType: (type || 'application/octet-stream'),
		action,
		filename,
	};

	return requestSignedUrl(req, data).then((signedUrl) => {
		if (res) {
			res.json({ signedUrl });
		}
		return Promise.resolve({ signedUrl });
	}).catch((err) => {
		if (res) {
			next(err);
		}
		return Promise.reject(err);
	});
};

// get signed url to upload file
router.post('/file', getSignedUrl);

// upload file directly
router.post('/upload', upload.single('upload'), (req, res, next) => getSignedUrl(req, null, next)
	.then(({ signedUrl }) => rp.put({
		url: signedUrl.url,
		headers: Object.assign({}, signedUrl.header, {
			'content-type': req.file.mimetype,
		}),
		body: req.file.buffer,
	})).then(() => {
		res.json({
			uploaded: 1,
			fileName: req.file.originalname,
		});
	}).catch(next));


// delete file
router.delete('/file', (req, res, next) => {
	const data = {
		_id: req.body.id,
	};
	api(req).delete('/fileStorage/', {
		qs: data,
	}).then(() => {
		res.sendStatus(200);
	}).catch(next);
});

// get file
router.get('/file', (req, res, next) => {
	const {
		file,
		download,
		name,
		share,
		lool,
	} = req.query;
	const data = {
		file,
		name,
		download: download || false,
	};

	const sharedPromise = share && share !== 'undefined'
		? registerSharedPermission(res.locals.currentUser._id, data.file, share, req)
		: Promise.resolve();

	sharedPromise.then(() => {
		if (lool) {
			return res.redirect(307, `/files/file/${file}/lool`);
		}

		return retrieveSignedUrl(req, data).then((signedUrl) => {
			res.redirect(307, signedUrl.url);
		});
	}).catch(next);
});


// open in LibreOffice Online frame
router.get('/file/:id/lool', (req, res, next) => {
	const { share } = req.query;

	// workaround for faulty sanitze hook (& => &amp;)
	if (share) {
		api(req).get(`/files/${req.params.id}`).then(() => {
			res.redirect(`/files/file?file=${req.params.id}&share=${share}&lool=true`);
		}).catch(next);
	} else {
		res.render('files/lool', {
			title: 'LibreOffice Online',
			libreOfficeUrl: getLibreOfficeUrl(req.params.id, req.cookies.jwt),
		});
	}
});

// move file
router.post('/file/:id/move', (req, res) => {
	api(req).patch(`/fileStorage/${req.params.id}`, {
		json: {
			parent: req.body.parent,
		},
	}).then(() => {
		req.session.notification = {
			type: 'success',
			message: 'Verschieben der Datei war erfolgreich!',
		};
		res.sendStatus(200);
	}).catch((e) => {
		req.session.notification = {
			type: 'danger',
			message: e.error.message.indexOf('E11000 duplicate key error') >= 0
				? 'Es existiert bereits eine Datei mit diesem Namen im Zielordner!'
				: e.error.message,
		};
		res.send(e);
	});
});

// create newFile
router.post('/newFile', (req, res, next) => {
	const {
		name,
		type,
		owner,
		parent,
	} = req.body;

	const fileName = name || 'Neue Datei';

	api(req).post('fileStorage/files/new', {
		json: {
			name: `${fileName}.${type}`,
			owner,
			parent,
		},
	}).then((result) => {
		res.send(result._id);
	}).catch(next);
});

// create directory
router.post('/directory', (req, res, next) => {
	const { name, owner, parent } = req.body;
	const json = {
		name: name || 'Neuer Ordner',
		owner,
		parent,
	};

	api(req).post('/fileStorage/directories', { json }).then((dir) => {
		res.json(dir);
	}).catch(next);
});

// delete directory
router.delete('/directory', (req, res, next) => {
	const data = {
		_id: req.body.id,
	};

	api(req).delete('/fileStorage/directories/', {
		qs: data,
	}).then(() => {
		res.sendStatus(200);
	}).catch(next);
});

router.get('/my/:folderId?/:subFolderId?', FileGetter, async (req, res, next) => {
	const userId = res.locals.currentUser._id;
	const basePath = '/files/my/';
	const parentId = req.params.subFolderId || req.params.folderId;

	res.locals.files.files = res.locals.files.files
		.filter(f => Boolean(f))
		.filter(file => file.owner === userId)
		.map(addThumbnails);

	let breadcrumbs = [{
		label: 'Meine persönlichen Dateien',
		url: basePath,
	}];

	if (req.params.folderId) {
		const folderBreadcrumbs = (await getBreadcrumbs(req, parentId)).map((crumb) => {
			crumb.url = `${basePath}${crumb.id}`;
			return crumb;
		});

		breadcrumbs = [...breadcrumbs, ...folderBreadcrumbs];
	}

	res.locals.files.files = res.locals.files.files.map((file) => {
		file.saveName = file.name.replace(/'/g, "\\'");
		return file;
	});

	res.render('files/files', Object.assign({
		title: 'Dateien',
		path: res.locals.files.path,
		breadcrumbs,
		canUploadFile: true,
		canCreateDir: true,
		canCreateFile: true,
		showSearch: true,
		inline: req.query.inline || req.query.CKEditor,
		CKEditor: req.query.CKEditor,
		parentId,
		canEditPermissions: true,
	}, res.locals.files));
});

router.get('/shared/', (req, res) => {
	const userId = res.locals.currentUser._id;

	api(req).get('/files', {
		qs: {
			$and: [
				{ permissions: { $elemMatch: { refPermModel: 'user', refId: userId } } },
				{ 'permissions.0.refId': { $ne: userId } },
			],
		},
	}).then(async (result) => {
		let { data } = result;
		data = data
			.filter(f => Boolean(f))
			.filter((file) => {
				if (file.owner === userId) {
					return false;
				}
				const permission = file.permissions.find(perm => perm.refId === userId);
				return permission ? !permission.write : false;
			})
			.map(addThumbnails);

		const files = {
			files: checkIfOfficeFiles(data.filter(f => !f.isDirectory)),
			directories: data.filter(f => f.isDirectory),
		};

		res.render('files/files', Object.assign({
			title: 'Dateien',
			path: '/',
			breadcrumbs: [{
				label: 'Mit mir geteilte Dateien',
				url: '/files/shared/',
			}],
			canUploadFile: false,
			canCreateDir: false,
			showSearch: true,
			inline: req.query.inline || req.query.CKEditor,
			CKEditor: req.query.CKEditor,
		}, files));
	});
});

router.get('/', (req, res, next) => {
	res.render('files/files-overview', Object.assign({
		title: 'Meine Dateien',
		showSearch: true,
	}));
});

router.get('/courses/', (req, res, next) => {
	const basePath = '/files/courses/';
	getScopeDirs(req, res, 'courses').then(async (directories) => {
		const breadcrumbs = [{
			label: 'Dateien aus meinen Kursen',
			url: basePath,
		}];

		res.render('files/files', {
			title: 'Dateien',
			path: getStorageContext(req, res),
			breadcrumbs,
			files: [],
			directories,
			showSearch: true,
		});
	});
});


router.get('/courses/:courseId/:folderId?', FileGetter, async (req, res, next) => {
	const basePath = '/files/courses/';
	const record = await api(req).get(`/courses/${req.params.courseId}`);
	res.locals.files.files = res.locals.files.files.map(addThumbnails);
	let canCreateFile = true;

	let breadcrumbs = [{
		label: 'Dateien aus meinen Kursen',
		url: basePath,
	}, {
		label: record.name,
		url: basePath + record._id,
	}];

	if (req.params.folderId) {
		const folderBreadcrumbs = (await getBreadcrumbs(req, req.params.folderId)).map((crumb) => {
			crumb.url = `${basePath}${record._id}/${crumb.id}`;
			return crumb;
		});
		breadcrumbs = [...breadcrumbs, ...folderBreadcrumbs];
	}

	if (['Schüler', 'Demo'].includes(res.locals.currentRole)) {
		canCreateFile = false;
	}

	res.render('files/files', Object.assign({
		title: 'Dateien',
		canUploadFile: true,
		canCreateDir: true,
		canCreateFile,
		path: res.locals.files.path,
		inline: req.query.inline || req.query.CKEditor,
		CKEditor: req.query.CKEditor,
		breadcrumbs,
		showSearch: true,
		courseId: req.params.courseId,
		ownerId: req.params.courseId,
		toCourseText: 'Zum Kurs',
		courseUrl: `/courses/${req.params.courseId}/`,
		canEditPermissions: true,
		parentId: req.params.folderId,
	}, res.locals.files));
});

router.get('/teams/', (req, res, next) => {
	const basePath = '/files/teams/';
	getScopeDirs(req, res, 'teams').then(async (directories) => {
		const breadcrumbs = [{
			label: 'Dateien aus meinen Teams',
			url: basePath,
		}];

		res.render('files/files', {
			title: 'Dateien',
			path: getStorageContext(req, res),
			breadcrumbs,
			teamFiles: true,
			files: [],
			directories,
			showSearch: true,
		});
	});
});


router.get('/teams/:teamId/:folderId?', FileGetter, async (req, res, next) => {
	const basePath = '/files/teams/';
	const team = await api(req).get(`/teams/${req.params.teamId}`);

	res.locals.files.files = res.locals.files.files.map(addThumbnails);

	let breadcrumbs = [{
		label: 'Dateien aus meinen Teams',
		url: basePath,
	}, {
		label: team.name,
		url: basePath + team._id,
	}];

	if (req.params.folderId) {
		const folderBreadcrumbs = (await getBreadcrumbs(req, req.params.folderId)).map((crumb) => {
			crumb.url = `${basePath}${team._id}/${crumb.id}`;
			return crumb;
		});

		breadcrumbs = [...breadcrumbs, ...folderBreadcrumbs];
	}

	res.render('files/files', Object.assign({
		title: 'Dateien',
		canUploadFile: true,
		canCreateDir: true,
		canCreateFile: true,
		path: res.locals.files.path,
		inline: req.query.inline || req.query.CKEditor,
		CKEditor: req.query.CKEditor,
		teamFiles: true,
		breadcrumbs,
		showSearch: true,
		courseId: req.params.teamId,
		ownerId: req.params.teamId,
		canEditPermissions: team.user.permissions.includes('EDIT_ALL_FILES'),
		toCourseText: 'Zum Team',
		courseUrl: `/teams/${req.params.teamId}/`,
		parentId: req.params.folderId,
	}, res.locals.files));
});


router.get('/classes/', (req, res, next) => {
	getScopeDirs(req, res, 'classes').then(async (directories) => {
		const breadcrumbs = [{
			label: 'Dateien aus meinen Klassen',
			url: '/files/classes/',
		}];

		res.render('files/files', {
			title: 'Dateien',
			path: getStorageContext(req, res),
			breadcrumbs,
			files: [],
			directories,
			showSearch: true,
		});
	});
});


router.get('/classes/:classId/:folderId?', FileGetter, (req, res, next) => {
	const basePath = '/files/classes/';
	api(req).get(`/classes/${req.params.classId}`).then(async (record) => {
		const files = res.locals.files.map(addThumbnails);

		let breadcrumbs = [{
			label: 'Dateien aus meinen Klassen',
			url: req.query.CKEditor ? '#' : changeQueryParams(req.originalUrl, { dir: '' }, basePath),
		}, {
			label: record.name,
			url: changeQueryParams(req.originalUrl, { dir: '' }, basePath + record._id),
		}];

		if (req.params.folderId) {
			const folderBreadcrumbs = (await getBreadcrumbs(req, req.params.folderId)).map((bread) => {
				bread.url = `${basePath}${record._id}/${bread.id}`;
				return bread;
			});

			breadcrumbs = [...breadcrumbs, ...folderBreadcrumbs];
		}

		res.render('files/files', Object.assign({
			title: 'Dateien',
			path: res.locals.files.path,
			canUploadFile: true,
			breadcrumbs,
			showSearch: true,
			inline: req.query.inline || req.query.CKEditor,
			CKEditor: req.query.CKEditor,
			parentId: req.params.folderId,
		}, files));
	});
});

router.post('/permissions/', (req, res) => {
	Promise.all([
		api(req).get('/roles', {
			qs: {
				name: {
					$regex: '^team',
				},
			},
		}),
		api(req).get(`/files/${req.body.id}`),
	]).then(([result, file]) => {
		if (!file) {
			res.json({});
			return;
		}

		const { data: roles } = result;

		file.shareToken = file.shareToken || shortid.generate();
		api(req).patch(`/files/${file._id}`, { json: file }).then((patchedFile) => {
			patchedFile.permissions = patchedFile.permissions.map((permission) => {
				const role = roles.find(_role => _role._id === permission.refId);
				permission.roleName = role ? role.name : '';
				return permission;
			});

			res.json(patchedFile);
		});
	});
});

router.get('/share/', (req, res) => api(req).get(`/files/${req.query.file}`)
	.then((file) => {
		let { shareToken } = file;

		if (!shareToken) {
			shareToken = shortid.generate();
			return api(req).patch(`/files/${file._id}`, { json: file })
				.then(() => Promise.resolve(shareToken));
		}

		return Promise.resolve(shareToken);
	})
	.then(shareToken => res.json({ shareToken }))
	.catch(() => res.sendStatus(500)));

router.get('/permissions/', (req, res) => {
	const { file } = req.query;

	return api(req).get('/fileStorage/permission/', {
		qs: { file },
	})
		.then(json => res.json(json))
		.catch(() => res.sendStatus(500));
});

router.patch('/permissions/', (req, res) => {
	const { permissions, fileId } = req.body;

	return api(req).patch(`/fileStorage/permission/${fileId}`, { json: { permissions } })
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(500));
});

router.get('/search/', (req, res, next) => {
	const { q, filter } = req.query;

	const filterQuery = filter
		? { type: filterQueries[filter] }
		: { name: { $regex: _.escapeRegExp(q), $options: 'i' } };

	api(req).get('/files/', {
		qs: filterQuery,
	}).then((result) => {
		const files = result.data.map(addThumbnails);
		const filterOption = filterOptions.filter(f => f.key === filter)[0];

		res.render('files/search', {
			title: 'Dateisuche',
			query: filterOption ? filterOption.label : q,
			files,
		});
	});
});

/** fetch all personal folders and all course folders in a directory-tree * */
router.get('/permittedDirectories/', async (req, res) => {
	const extractor = ({ _id, name }) => ({ _id, name, children: [] });

	const directoryTree = [{
		name: 'Meine Dateien',
		model: 'user',
		children: [{
			name: 'Persönliche Dateien',
			_id: res.locals.currentUser._id,
			children: [],
		}],
	}, {
		name: 'Meine Kurs-Dateien',
		model: 'course',
		children: (await getScopeDirs(req, res, 'courses')).map(extractor),
	}];

	if (process.env.FEATURE_TEAMS_ENABLED === 'true') {
		directoryTree.push({
			name: 'Meine Team-Dateien',
			model: 'teams',
			children: (await getScopeDirs(req, res, 'teams')).map(extractor),
		});
	}

	api(req).get('/fileStorage/directories')
		.then((directories) => {
			if (directories.code === 404) {
				return Promise.resolve([]);
			}
			return directories.filter(dir => !dir.parent).map(dir => getDirectoryTree(directories, dir));
		})
		.then((directories) => {
			directoryTree.forEach((tree) => {
				tree.children.forEach((child) => {
					child.children = directories.filter(
						dir => dir.owner === child._id && dir.refOwnerModel === tree.model,
					);
				});
			});

			return res.json(directoryTree);
		});
});

/** File and Directory proxy models */
router.post('/fileModel', (req, res, next) => {
	// req.body.schoolId = res.locals.currentSchool;
	api(req).post('/fileStorage/', { json: req.body }).then(file => res.json(file)).catch(err => next(err));
});

// get file by proxy id
router.get('/fileModel/:id/proxy', (req, res, next) => {
	const fileId = req.params.id;
	const { download, share } = req.query;

	api(req).get(`/files/${fileId}`).then(() => {
		// redirects to real file getter
		res.redirect(`/files/file?file=${fileId}&download=${download}&share=${share}`);
	});
});

router.post('/fileModel/:id/rename', (req, res) => {
	api(req).post('/fileStorage/rename', {
		json: {
			id: req.params.id,
			newName: req.body.name,
		},
	})
		.then(() => {
			req.session.notification = {
				type: 'success',
				message: 'Umbenennen der Datei war erfolgreich!',
			};

			res.redirect(req.header('Referer'));
		})
		.catch((e) => {
			req.session.notification = {
				type: 'danger',
				message: e.error.message.indexOf('E11000 duplicate key error') >= 0
					? 'Es existiert bereits eine Datei mit diesem Namen im gleichen Ordner!'
					: e.error.message,
			};

			res.redirect(req.header('Referer'));
		});
});

router.post('/directoryModel/:id/rename', (req, res, next) => {
	api(req).post('/fileStorage/directories/rename', {
		json: {
			id: req.params.id,
			newName: req.body.name,
		},
	})
		.then(() => {
			req.session.notification = {
				type: 'success',
				message: 'Umbenennen des Ordners war erfolgreich!',
			};

			res.redirect(req.header('Referer'));
		})
		.catch((e) => {
			req.session.notification = {
				type: 'danger',
				message: e.error.message.indexOf('E11000 duplicate key error') >= 0
					? 'Es existiert bereits ein Ordner mit diesem Namen im gleichen Ordner!'
					: e.error.message,
			};

			res.redirect(req.header('Referer'));
		});
});

module.exports = router;

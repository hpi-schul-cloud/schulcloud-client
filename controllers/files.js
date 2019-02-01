/*
 * One Controller per layout view
 */

const fs = require('fs');
const pathUtils = require('path').posix;
const url = require('url');
const mime = require('mime');
const api = require('../api');
const rp = require('request-promise');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const multer = require('multer');
const shortid = require('shortid');
const upload = multer({storage: multer.memoryStorage()});
const _ = require('lodash');
const winston = require('winston');
const {changeQueryParams, getStorageContext, checkIfOfficeFiles, FileGetter} = require('../helpers/files/fileGetter');

const filterOptions = [
    {key: 'pics', label: 'Bilder'},
    {key: 'videos', label: 'Videos'},
    {key: 'pdfs', label: 'PDF Dokumente'},
    {key: 'msoffice', label: 'Word/Excel/PowerPoint'}
];

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const filterQueries = {
    pics: {$regex: 'image'},
    videos: {$regex: 'video'},
    pdfs: {$regex: 'pdf'},
    msoffice: {$regex: 'officedocument|msword|ms-excel|ms-powerpoint'}
};

const thumbs = {
    default: "/images/thumbs/default.png",
    psd: "/images/thumbs/psds.png",
    txt: "/images/thumbs/txts.png",
    doc: "/images/thumbs/docs.png",
    png: "/images/thumbs/pngs.png",
    mp4: "/images/thumbs/mp4s.png",
    mp3: "/images/thumbs/mp3s.png",
    aac: "/images/thumbs/aacs.png",
    avi: "/images/thumbs/avis.png",
    gif: "/images/thumbs/gifs.png",
    html: "/images/thumbs/htmls.png",
    js: "/images/thumbs/jss.png",
    mov: "/images/thumbs/movs.png",
    xls: "/images/thumbs/xlss.png",
    xlsx: "/images/thumbs/xlss.png",
    pdf: "/images/thumbs/pdfs.png",
    flac: "/images/thumbs/flacs.png",
    jpg: "/images/thumbs/jpgs.png",
    jpeg: "/images/thumbs/jpgs.png",
    docx: "/images/thumbs/docs.png",
    ai: "/images/thumbs/ais.png",
    tiff: "/images/thumbs/tiffs.png"
};

/**
 * sends a signedUrl request to the server
 * @param {*} data, contains the path for the requested file
 */
const requestSignedUrl = (req, data) => {
    return api(req).post('/fileStorage/signedUrl', {
        json: data
    });
};



/**
 * generates the displayed breadcrumbs on the actual file page
 */
const getBreadcrumbs = (req, {dir = '', baseLabel = '', basePath = '/files/my/'} = {}) => {
    let dirParts = '';
    const currentDir = dir || req.query.dir || '';
    let pathComponents = currentDir.split('/') || [];
    if (pathComponents[0] === 'users' || pathComponents[0] === 'courses' || pathComponents[0] === 'classes') pathComponents = pathComponents.slice(2);   // remove context and ID, if present
    const breadcrumbs = pathComponents.filter(value => value).map(dirPart => {
        dirParts += '/' + dirPart;
        return {
            label: dirPart,
            url: changeQueryParams(req.originalUrl, {dir: dirParts}, basePath)
        };
    });

    if (baseLabel) {
        breadcrumbs.unshift({
            label: baseLabel,
            url: changeQueryParams(req.originalUrl, {dir: ''}, basePath)
        });
    }

    return breadcrumbs;
};





/**
 * fetches all sub-scopes (courses, classes etc.) for a given user and super-scope
 */
const getScopeDirs = (req, res, scope) => {
    return api(req).get('/' + scope + '/', {
        qs: {
            $or: [
                {userIds: res.locals.currentUser._id},
                {teacherIds: res.locals.currentUser._id}
            ]
        }
    }).then(records => {
        return records.data.map(record => {
            return Object.assign(record, {
                url: '/files/' + scope + '/' + record._id
            });
        });
    });
};

/**
 * generates a directory tree from a path recursively
 * @param rootPath
 */
const getDirectoryTree = (req, rootPath) => {
    return api(req).get('/directories/', {qs: {path: rootPath}}).then(dirs => {
        if (!dirs.data.length) return [];
        return Promise.all((dirs.data || []).map(d => {
            let subDir = {
                name: d.name,
                path: d.key + '/',
            };

            return getDirectoryTree(req, subDir.path).then(subDirs => {
                subDir.subDirs = subDirs;
                return subDir;
            });
        }));
    });
};

/**
 * register a new filePermission for the given user for the given file
 * @param userId {String} - the user which should be granted permission
 * @param filePath {String} - the file for which a new permission should be created
 * @param shareToken {String} - a token for verify enabled sharing
 */
const registerSharedPermission = (userId, filePath, shareToken, req) => {
    // check whether sharing is enabled for given file
    return api(req).get('/files/', {qs: {key: encodeURI(filePath), shareToken: shareToken}}).then(res => {
        let file = res.data[0];
        // verify given share token
        if (!file || file.shareToken !== shareToken) {
            // owner permits sharing of given file
            return Promise.reject("Zu dieser Datei haben Sie keinen Zugriff!");
        } else {

            let file = res.data[0];
            if (!_.some(file.permissions, {userId: userId})) {
                file.permissions.push({
                    userId: userId,
                    permissions: ['can-read', 'can-write'] // todo: make it selectable
                });
                return api(req).patch('/files/' + res.data[0]._id, {json: file});
            }
        }
    });
};



/**
 * generates the correct LibreOffice url for (only) opening office-files
 * @param {*} fileId, the id of the file which has to be opened in LibreOffice
 * @param {*} accessToken, the auth token for the wopi-host later on
 * see https://wopi.readthedocs.io/en/latest/overview.html#integration-process for further details
 */
const getLibreOfficeUrl = (fileId, accessToken) => {
    if (!process.env.LIBRE_OFFICE_CLIENT_URL) {
        logger.error('LibreOffice env is currently not defined.');
        return;
    }

    // in the form like: http://ecs-80-158-4-11.reverse.open-telekom-cloud.com:9980
    const libreOfficeBaseUrl = process.env.LIBRE_OFFICE_CLIENT_URL;
    const wopiRestUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030';

    return `${libreOfficeBaseUrl}/loleaflet/dist/loleaflet.html?WOPISrc=${wopiRestUrl}/wopi/files/${fileId}?access_token=${accessToken}`;
};


// secure routes
router.use(authHelper.authChecker);

const getSignedUrl = function (req, res, next) {
    let {type, path, action = 'putObject'} = req.body;
    path = path || req.query.path;
    const filename = (req.file || {}).originalname;
    if (filename) path = path + '/' + filename;

    const data = {
        path,
        fileType: (type || 'application/octet-stream'),
        action: action
    };

    return requestSignedUrl(req, data).then(signedUrl => {
        if (res) res.json({signedUrl, path});
        else return Promise.resolve({signedUrl, path});
    }).catch(err => {
        if (res) res.status((err.statusCode || 500)).send(err);
        else return Promise.reject(err);
    });
};

// get signed url to upload file
router.post('/file', getSignedUrl);

// upload file directly
router.post('/upload', upload.single('upload'), function (req, res, next) {
    let _path;
    return getSignedUrl(req, null, next).then(({signedUrl, path}) => {
        _path = path;
        return rp.put({
            url: signedUrl.url,
            headers: Object.assign({}, signedUrl.header, {
                'content-type': req.file.mimetype
            }),
            body: req.file.buffer
        });
    }).then(_ => {
        res.json({
            "uploaded": 1,
            "fileName": req.file.originalname,
            "url": "/files/file?path=" + _path
        });
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});


// delete file
router.delete('/file', function (req, res, next) {
    const data = {
        path: req.body.key,
        fileType: null,
        action: null
    };

    api(req).delete('/fileStorage/', {
        qs: data
    }).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});

// get file
router.get('/file', function (req, res, next) {

    const {file, download, path, share, lool, fileId} = req.query;
    const data = {
        path: path || file,
        fileType: mime.lookup(file || pathUtils.basename(path)),
        action: 'getObject',
		download:download||false
    };
    let sharedPromise = share && share !== 'undefined' ? registerSharedPermission(res.locals.currentUser._id, data.path, share, req) : Promise.resolve();
    sharedPromise.then(_ => {
        if (lool) return res.redirect(307, `/files/file/${fileId}/lool`);
        return requestSignedUrl(req, data).then(signedUrl => {
			res.redirect(307,signedUrl.url);
           /* return rp.get(signedUrl.url, {encoding: null}).then(awsFile => {
                if (download && download !== 'undefined') {
                    res.type('application/octet-stream');
                    res.set('Content-Disposition', 'attachment;filename=' + encodeURI(pathUtils.basename(data.path)));
                } else if (signedUrl.header['Content-Type']) {
                    res.type(signedUrl.header['Content-Type']);
                }

                res.end(awsFile, 'binary');
            }); */
        });
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});


// open in LibreOffice Online frame
router.get('/file/:id/lool', function(req, res, next) {
    const { share } = req.query;

    // workaround for faulty sanitze hook (& => &amp;)
    if (share) {
        api(req).get('/files/' + req.params.id).then(file => {
            res.redirect(`/files/file?path=${file.key}&share=${share}&lool=true&fileId=${req.params.id}`);
        });
    } else {
        res.render('files/lool', {
            title: 'LibreOffice Online',
            libreOfficeUrl: getLibreOfficeUrl(req.params.id, req.cookies.jwt)
        });
    }
});

// move file
router.post('/file/:id/move', function (req, res, next) {
    api(req).patch('/fileStorage/' + req.params.id, {
        json: {
            fileName: req.body.fileName,
            path: req.body.oldPath,
            destination: req.body.newPath
        }
    }).then(_ => {
        req.session.notification = {
            type: 'success',
            message: 'Verschieben der Datei war erfolgreich!'
        };
        res.sendStatus(200);
    }).catch(e => {
        req.session.notification = {
            type: 'danger',
            message: e.error.message.indexOf("E11000 duplicate key error") >= 0
                ? 'Es existiert bereits eine Datei mit diesem Namen im Zielordner!'
                : e.error.message
        };
        res.send(e);
    });
});

// create newFile
router.post('/newFile', function (req, res, next) {
    const {name, dir, type, studentEdit} = req.body;

    const basePath = dir;
    const fileName = name || 'Neue Datei';
    api(req).post('fileStorage/files/new', {
        json: {
            key: `${basePath}${fileName}.${type}`,
            path: basePath,
            name: `${fileName}.${type}`,
            studentCanEdit: studentEdit,
            schoolId: res.locals.currentSchool
        }
    }).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});

// create directory
router.post('/directory', function (req, res, next) {
    const {name, dir} = req.body;

    const basePath = dir;
    const dirName = name || 'Neuer Ordner';
    const path = `${basePath}${dirName}`;

	api(req).post('/fileStorage/directories', {
		json: {
			path,
		}
	}).then(_ => {
		res.sendStatus(200);
	}).catch(err => {
		res.status((err.statusCode || 500)).send(err);
	});
});

// delete directory
router.delete('/directory', function (req, res) {
    const data = {
        path: req.body.key
    };

    api(req).delete('/fileStorage/directories/', {
        qs: data
    }).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});

router.get('/my/', FileGetter, function (req, res, next) {
    let files = res.locals.files.files;
    files.map(file => {
        let ending = file.name.split('.').pop();
        file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
    });
    res.render('files/files', Object.assign({
        title: 'Dateien',
        path: res.locals.files.path,
        breadcrumbs: getBreadcrumbs(req, {
            baseLabel: 'Meine persönlichen Dateien'
        }),
        canUploadFile: true,
        canCreateDir: true,
        canCreateFile: true,
        showSearch: true,
        inline: req.query.inline || req.query.CKEditor,
        CKEditor: req.query.CKEditor
    }, res.locals.files));
});

router.get('/shared/', function (req, res, next) {
    api(req).get('/files')
        .then(files => {
            files.files = files.data.filter(f => f.context === 'geteilte Datei');

            files.files.map(file => {
                file.file = file.path + file.name;
                let ending = file.name.split('.').pop();
                file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
            });

            res.render('files/files', Object.assign({
                title: 'Dateien',
                path: '/',
                breadcrumbs: getBreadcrumbs(req, {
                    baseLabel: 'Mit mir geteilte Dateien'
                }),
                canUploadFile: false,
                canCreateDir: false,
                showSearch: true,
                inline: req.query.inline || req.query.CKEditor,
                CKEditor: req.query.CKEditor
            }, files));
        });
});

router.get('/', function (req, res, next) {
    // get count of personal and course files/directories
    /*let myFilesPromise = api(req).get("/files/", {qs: {path: {$regex: "^users"}}});
    let courseFilesPromise = api(req).get("/files/", {qs: {path: {$regex: "^courses"}}});

    Promise.all([myFilesPromise, courseFilesPromise]).then(([myFiles, courseFiles]) => {
        // filter shared files
        let sharedFiles = [];
        myFiles = myFiles.data.filter(f => {
            if (f.context !== 'geteilte Datei') {
                return true;
            } else {
                sharedFiles.push(f);
            }
        });
        courseFiles = courseFiles.data.filter(f => {
            if (f.context !== 'geteilte Datei') {
                return true;
            } else {
                sharedFiles.push(f);
            }
        });
    */
        res.render('files/files-overview', Object.assign({
            title: 'Meine Dateien',
            showSearch: true
            //counter: {myFiles: myFiles.length, courseFiles: courseFiles.length, sharedFiles: sharedFiles.length}
        }));

    //});
});


router.get('/courses/', function (req, res, next) {
    const basePath = '/files/courses/';
    getScopeDirs(req, res, 'courses').then(directories => {
        const breadcrumbs = getBreadcrumbs(req, {basePath});

        breadcrumbs.unshift({
            label: 'Dateien aus meinen Kursen',
            url: changeQueryParams(req.originalUrl, {dir: ''}, '/files/courses/')
        });

        res.render('files/files', {
            title: 'Dateien',
            path: getStorageContext(req, res),
            breadcrumbs,
            files: [],
            directories,
            showSearch: true
        });
    });
});


router.get('/courses/:courseId', FileGetter, function (req, res, next) {
    const basePath = '/files/courses/';
    api(req).get('/courses/' + req.params.courseId).then(record => {
        let files = res.locals.files.files;
        files.map(file => {
            let ending = file.name.split('.').pop();
            file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
        });

        const breadcrumbs = getBreadcrumbs(req, {basePath: basePath + record._id});

        breadcrumbs.unshift({
            label: 'Dateien aus meinen Kursen',
            url: req.query.CKEditor ? '#' : changeQueryParams(req.originalUrl, {dir: ''}, basePath)
        }, {
            label: record.name,
            url: changeQueryParams(req.originalUrl, {dir: ''}, basePath + record._id)
        });

        let canCreateFile = true;
        if (['Schüler', 'Demo'].includes(res.locals.currentRole))
            canCreateFile = false;

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
                courseUrl: `/courses/${req.params.courseId}/`
            }, res.locals.files));

    });
});


router.get('/classes/', function (req, res, next) {
    getScopeDirs(req, res, 'classes').then(directories => {
        const breadcrumbs = getBreadcrumbs(req);

        breadcrumbs.unshift({
            label: 'Dateien aus meinen Klassen',
            url: changeQueryParams(req.originalUrl, {dir: ''}, '/files/classes/')
        });

        res.render('files/files', {
            title: 'Dateien',
            path: getStorageContext(req, res),
            breadcrumbs,
            files: [],
            directories,
            showSearch: true
        });
    });
});


router.get('/classes/:classId', FileGetter, function (req, res, next) {
    const basePath = '/files/classes/';
    api(req).get('/classes/' + req.params.classId).then(record => {
        let files = res.locals.files.files;
        files.map(file => {
            let ending = file.name.split('.').pop();
            file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
        });

        const breadcrumbs = getBreadcrumbs(req, {basePath});

        breadcrumbs.unshift({
            label: 'Dateien aus meinen Klassen',
            url: req.query.CKEditor ? '#' : changeQueryParams(req.originalUrl, {dir: ''}, basePath)
        }, {
            label: record.name,
            url: changeQueryParams(req.originalUrl, {dir: ''}, basePath + record._id)
        });

        res.render('files/files', Object.assign({
            title: 'Dateien',
            path: res.locals.files.path,
            canUploadFile: true,
            breadcrumbs,
            showSearch: true,
            inline: req.query.inline || req.query.CKEditor,
            CKEditor: req.query.CKEditor,
        }, res.locals.files));

    });
});

router.post('/permissions/', function (req, res, next) {
    api(req).get('/files/' + req.body.id).then(file => {
        if (!file) {
            res.json({});
            return;
        }
        file.shareToken = file.shareToken || shortid.generate();
        api(req).patch("/files/" + file._id, {json: file}).then(filePermission => {
            res.json(filePermission);
        });
    });
});

router.get('/search/', function (req, res, next) {
    const {q, filter} = req.query;

    let filterQuery = filter ?
        {type: filterQueries[filter]} :
        {name: {$regex: _.escapeRegExp(q), $options: 'i'}};

    api(req).get('/files/', {
        qs: filterQuery
    }).then(result => {
        let files = result.data;
        files.forEach(file => {
            let ending = file.name.split('.').pop();
            file.thumbnail = thumbs[ending] ? thumbs[ending] : thumbs['default'];
            file.file = pathUtils.join(file.path, file.name);
        });

        let filterOption = filterOptions.filter(f => f.key === filter)[0];

        res.render('files/search', {
            title: 'Dateisuche',
            query: filterOption ? filterOption.label : q,
            files: files
        });
    });
});

/** fetch all personal folders and all course folders in a directory-tree **/
router.get('/permittedDirectories/', function (req, res, next) {
    let userPath = `users/${res.locals.currentUser._id}/`;
    let directoryTree = [{
        name: 'Meine Dateien',
        path: userPath,
        subDirs: []
    }, {
        name: 'Meine Kurs-Dateien',
        subDirs: []
    }];
    getDirectoryTree(req, userPath) // root folder personal files
        .then(personalDirs => {
            directoryTree[0].subDirs = personalDirs;

            // fetch tree for all course folders
            directoryTree.push();
            getScopeDirs(req, res, 'courses').then(courses => {
                Promise.all((courses || []).map(c => {
                    let coursePath = `courses/${c._id}/`;
                    let newCourseDir = {
                        name: c.name,
                        path: coursePath,
                        subDirs: []
                    };

                    return getDirectoryTree(req, coursePath).then(dirs => {
                        newCourseDir.subDirs = dirs;
                        directoryTree[1].subDirs.push(newCourseDir);
                        return;
                    });
                })).then(_ => {
                    res.json(directoryTree);
                });
            });
        });
});

/**** File and Directory proxy models ****/
router.post('/fileModel', function (req, res, next) {
    req.body.schoolId = res.locals.currentSchool;
    api(req).post('/files/', {json: req.body}).then(file => res.json(file)).catch(err => next(err));
});

// get file by proxy id
router.get('/fileModel/:id/proxy', function (req, res, next) {
    let fileId = req.params.id;
    const {download, share} = req.query;
    api(req).get('/files/' + fileId).then(file => {
        // redirects to real file getter
        res.redirect(`/files/file?path=${file.key}&download=${download}&share=${share}`);
    });
});

router.post('/fileModel/:id/rename', function(req, res, next) {
    api(req).post('/fileStorage/rename', {json: {
        path: req.body.key,
        newName: req.body.name
    }})
        .then(_ => {
            req.session.notification = {
                type: 'success',
                message: 'Umbenennen der Datei war erfolgreich!'
            };

            res.redirect(req.header('Referer'));
        })
        .catch(e => {
            req.session.notification = {
                type: 'danger',
                message: e.error.message.indexOf("E11000 duplicate key error") >= 0
                ? 'Es existiert bereits eine Datei mit diesem Namen im gleichen Ordner!'
                : e.error.message
            };

            res.redirect(req.header('Referer'));
        });
});

router.post('/directoryModel/:id/rename', function(req, res, next) {
    api(req).post('/fileStorage/directories/rename', {json: {
        path: req.body.key,
        newName: req.body.name
    }})
        .then(_ => {
            req.session.notification = {
                type: 'success',
                message: 'Umbenennen des Ordners war erfolgreich!'
            };

            res.redirect(req.header('Referer'));
        })
        .catch(e => {
            req.session.notification = {
                type: 'danger',
                message: e.error.message.indexOf("E11000 duplicate key error") >= 0
                ? 'Es existiert bereits ein Ordner mit diesem Namen im gleichen Ordner!'
                : e.error.message
            };

            res.redirect(req.header('Referer'));
        });
});

router.post('/studentCanEdit', function(req, res, next) {
   api(req).patch(`/files/${req.body.id}`, {
       json: {
           studentCanEdit: req.body.bool
       }
   })
       .then(_ => {
           res.json({success: true});
       });
});


module.exports = router;

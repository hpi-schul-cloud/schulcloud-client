const pathUtils = require('path').posix;
const url = require('url');
const api = require('../../api');
const winston = require('winston');


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

/**
 * handles query params for file requests
 */
const changeQueryParams = (originalUrl, params = {}, pathname = '') => {
    const urlParts = url.parse(originalUrl, true);

    Object.keys(params).forEach(param => {
        urlParts.query[param] = params[param];
    });

    if (pathname) {
        urlParts.pathname = pathname;
    }

    delete urlParts.search;
    return url.format(urlParts);
};

/**
 * generates the correct file's or directory's storage context for further requests
 */
const getStorageContext = (req, res, options = {}) => {

    if (req.query.storageContext) {
        return pathUtils.normalize(req.query.storageContext + '/');
    }

    let currentDir = options.dir || req.query.dir || '/';
    const urlParts = url.parse((options.url || req.originalUrl), true);

    let storageContext = urlParts.pathname.replace('/files/', '/');

    if (storageContext === '/my/') {
        storageContext = 'users/' + res.locals.currentUser._id + '/';
    }

    if (currentDir.slice(-1) !== '/') currentDir = currentDir + '/';
    return pathUtils.join(storageContext, currentDir);
};

/**
 * check whether given files can be opened in LibreOffice
 */
const checkIfOfficeFiles = files => {
    if (!process.env.LIBRE_OFFICE_CLIENT_URL) {
        logger.error('LibreOffice env is currently not defined.');
        return;
    }

    const officeFileTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',     //.docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',           //.xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',   //.pptx
        'application/vnd.ms-powerpoint',                                               //.ppt
        'application/vnd.ms-excel',                                                    //.xlx
        'application/vnd.ms-word',                                                     //.doc
        'application/vnd.oasis.opendocument.text',                                     //.odt
        'text/plain',                                                                  //.txt
        'application/msword'                                                           //.doc
    ];

    files.forEach(f => f.isOfficeFile = officeFileTypes.indexOf(f.type) >= 0);
};

/**
 * fetches all files and directories for a given storageContext
 */
const FileGetter = (req, res, next) => {
    let path = getStorageContext(req, res);
    let pathComponents = path.split('/');
    if (pathComponents[0] === '') pathComponents = pathComponents.slice(1); // remove leading slash, if present
    const currentDir = pathComponents.slice(2).join('/') || '/';

    path = pathComponents.join('/');

    return api(req).get('/fileStorage', {
        qs: {path}
    }).then(data => {
        let {files, directories} = data;

        files = files.map(file => {
            file.file = file.key;
            return file;
        });

        directories = directories.map(dir => {
            const targetUrl = pathUtils.join(currentDir, dir.name);
            dir.url = changeQueryParams(req.originalUrl, {dir: targetUrl});
            dir.originalPath = path;
            dir.path = pathUtils.join(path, dir.name);
            return dir;
        });

        checkIfOfficeFiles(files);

        res.locals.files = {
            files,
            directories,
            path
        };

        next();
    }).catch(err => {
        next(err);
    });
};

module.exports = {changeQueryParams, getStorageContext, checkIfOfficeFiles, FileGetter};

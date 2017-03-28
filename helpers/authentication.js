const jwt = require('jsonwebtoken');
const api = require('../api');
const permissionsHelper = require('./permissions');

const rolesDisplayName = {
    'teacher': 'Lehrer',
    'student': 'Schüler',
    'administrator': 'Administrator',
    'superhero': 'Schul-Cloud Mitarbeiter'
};

const isJWT = (req) => {
    return (req && req.cookies && req.cookies.jwt);
};

const isAuthenticated = (req) => {
    if(!isJWT(req)) {
        return Promise.resolve(false);
    }

    return api(req).post('/authentication', {json: {
        strategy: 'jwt',
        accessToken: req.cookies.jwt
    }}).then(_ => {
        return true;
    }).catch(_ => {
        return false;
    });
};

const authChecker = (req, res, next) => {
    isAuthenticated(req)
        .then(isAuthenticated => {
            if(isAuthenticated) {

                // fetch user profile
                populateCurrentUser(req, res)
                    .then(_ => {
                        return restrictSidebar(req, res);
                    })
                    .then(_ => {
                        next();
                    });
            } else {
                res.redirect('/login/');
            }
        });
};

const populateCurrentUser = (req, res) => {
    let payload = {};
    if(isJWT(req)) {
        payload = (jwt.decode(req.cookies.jwt, {complete: true}) || {}).payload;
        res.locals.currentPayload = payload;
    }

    if(payload.userId) {
        return api(req).get('/users/' + payload.userId,{ qs: {
            $populate: ['roles']
        }}).then(data => {
            res.locals.currentUser = data;
            res.locals.currentRole = rolesDisplayName[data.roles[0].name];
            return api(req).get('/schools/' + res.locals.currentUser.schoolId, { qs: {
                $populate: ['federalState']
            }}).then(data => {
                res.locals.currentSchool = res.locals.currentUser.schoolId;
                res.locals.currentSchoolData = data;
                return data;
            });
        });
    }

    return Promise.resolve();
};


const restrictSidebar = (req, res) => {
    res.locals.sidebarItems = res.locals.sidebarItems.filter(item => {
        if(!item.permission) return true;

        return permissionsHelper.userHasPermission(res.locals.currentUser, item.permission);
    });
};


module.exports = {
    isJWT,
    authChecker,
    isAuthenticated,
    populateCurrentUser
};

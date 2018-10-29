const jwt = require('jsonwebtoken');
const api = require('../api');
const permissionsHelper = require('./permissions');

const rolesDisplayName = {
    'teacher': 'Lehrer',
    'student': 'Schüler',
    'administrator': 'Administrator',
    'superhero': 'Schul-Cloud Admin',
    'demo': 'Demo',
    'demoTeacher': 'Demo',
    'demoStudent': 'Demo',
    'helpdesk': 'Helpdesk',
    'betaTeacher': 'Beta',
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
                        return checkConsent(req, res);
                    })
                    .then(_ => {
                        return restrictSidebar(req, res);
                    })
                    .then(_ => {
                        next();
                    })
					.catch(err=>{
						if(err=="firstLogin was not completed, redirecting..."){
							//print message?
							res.redirect('/login/success');
						}else{
							res.redirect('/login/');
						}
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

    // separates users in two groups for AB testing
    function setTestGroup(user) {
        if (process.env.SW_ENABLED) {
            const lChar = user._id.substr(user._id.length - 1);
            const group = parseInt(lChar, 16) % 2 ? 1 : 0;
            user.testGroup = group;
        } else {
            user.testGroup = 0;
        }
    }

    if(payload.userId) {
        return api(req).get('/users/' + payload.userId,{ qs: {
            $populate: ['roles']
        }}).then(data => {
            res.locals.currentUser = data;
            setTestGroup(res.locals.currentUser);
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

const checkConsent = (req, res) => {
    if (
    ((res.locals.currentUser||{}).preferences||{}).firstLogin ||	//do not exist if 3. system login
    req.path == "/login/success" ||
    req.baseUrl == "/firstLogin") {
        return Promise.resolve();
    }else{
		return Promise.reject("firstLogin was not completed, redirecting...");
	} 
};


const restrictSidebar = (req, res) => {
    res.locals.sidebarItems = res.locals.sidebarItems.filter(item => {
        if(!item.permission) return true;
        
        let hasRequiredPermission = permissionsHelper.userHasPermission(res.locals.currentUser, item.permission);
        let hasNoExcludedPermission = !permissionsHelper.userHasPermission(res.locals.currentUser, item.excludedPermission)
        return hasRequiredPermission && hasNoExcludedPermission;
        // excludedPermission is used to prevent the case that an Admin has both: Verwaltung and Administration
    });
};


module.exports = {
    isJWT,
    authChecker,
    isAuthenticated,
    restrictSidebar,
    populateCurrentUser
};

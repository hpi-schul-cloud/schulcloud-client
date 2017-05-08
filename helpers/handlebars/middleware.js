const url = require('url');
const moment = require('moment');

const makeActive = (items, currentUrl) => {
	currentUrl += "/";		
    return items.map(item => {
        const regex = new RegExp("^" + item.link, "i");

        if (currentUrl.replace(regex, '') === '') {
            item.class = 'active';
            item.childActive = true;
        } else if(currentUrl.match(regex)) {
            if(item.children) {
                item.class = 'child-active';
            } else {
                item.class = 'active';
            }
            item.childActive = true;
        }

        if(item.children) {
            makeActive(item.children, currentUrl);
        }

        return item;
    });
};

module.exports = (req, res, next) => {
    // TODO: based on permissions

    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
    }, {
        name: 'Fächer / Kurse',
        icon: 'graduation-cap',
        link: '/courses/'
    }, {
        name: 'Termine',
        icon: 'table',
        link: '/calendar/'
    }, {
        name: 'Aufgaben',
        icon: 'tasks',
        link: '/homework/'
    }, {
        name: 'Meine Dateien',
        icon: 'folder-open',
        link: '/files/',
        children: [
            {
                name: 'Fächer / Kurse',
                icon: 'folder-open-o',
                link: '/files/courses/'
            },
            {
                name: 'Klassen',
                icon: 'folder-open-o',
                link: '/files/classes/'
            }
        ]
    }, {
        name: 'Materialien',
        icon: 'search',
        link: '/content/'
    }];

    res.locals.sidebarItems.push({
        name: 'Administration',
        icon: 'cogs',
        link: '/administration/',
        permission: 'ADMIN_VIEW',
        children: [
            {
                name: 'Kurse',
                icon: 'users',
                link: '/administration/courses/'
            },
            {
                name: 'Klassen',
                icon: 'users',
                link: '/administration/classes/'
            },
            {
                name: 'Lehrer',
                icon: 'users',
                link: '/administration/teachers/'
            },
            {
                name: 'Schüler',
                icon: 'users',
                link: '/administration/students/'
            },
            {
                name: 'Authentifizierung',
                icon: 'key',
                link: '/administration/systems/'
            }
        ]
    });

    makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

    // TODO: use real notification proxy
    const notificationsPromise = Promise.resolve({
        "total": 9,
        "limit": 5,
        "skip": 0,
        "data": [
            {
                "_id": "5910396de249634cc8462cb4",
                "message": {
                    "priority": "medium",
                    "scopeIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "userIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "createdAt": "2017-05-08T09:25:01.396Z",
                    "updatedAt": "2017-05-08T09:25:01.396Z",
                    "_id": "5910396de249634cc8462cb3",
                    "applicationId": "0000d231816abba584714c9e",
                    "body": "Wap Bap",
                    "title": "sdfsfsdfsdf22222",
                    "__v": 0
                },
                "user": "0000d231816abba584714c9e",
                "__v": 2,
                "updatedAt": "2017-05-08T09:25:01.847Z",
                "createdAt": "2017-05-08T09:25:01.847Z",
                "callbacks": [
                    {
                        "type": "received",
                        "_id": "59103970e249634cc8462cb6",
                        "createdAt": "2017-05-08T09:25:04.757Z"
                    }
                ],
                "stateHistory": [
                    {
                        "state": "created"
                    }
                ],
                "state": "escalated"
            },
            {
                "_id": "59103b5fe249634cc8462cba",
                "message": {
                    "priority": "medium",
                    "scopeIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "userIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "createdAt": "2017-05-08T09:33:19.808Z",
                    "updatedAt": "2017-05-08T09:33:19.808Z",
                    "_id": "59103b5fe249634cc8462cb9",
                    "applicationId": "0000d231816abba584714c9e",
                    "body": "You have a new Notification",
                    "title": "New Notification from Teacher1_1",
                    "__v": 0
                },
                "user": "0000d231816abba584714c9e",
                "__v": 1,
                "updatedAt": "2017-05-08T09:33:19.868Z",
                "createdAt": "2017-05-08T09:33:19.868Z",
                "callbacks": [],
                "stateHistory": [
                    {
                        "state": "created"
                    }
                ],
                "state": "escalated"
            },
            {
                "_id": "59103b89e249634cc8462cbf",
                "message": {
                    "priority": "medium",
                    "scopeIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "userIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "createdAt": "2017-05-08T09:34:01.777Z",
                    "updatedAt": "2017-05-08T09:34:01.777Z",
                    "_id": "59103b89e249634cc8462cbe",
                    "applicationId": "0000d231816abba584714c9e",
                    "body": "You have a new Notification",
                    "title": "New Notification from Teacher1_1",
                    "__v": 0
                },
                "user": "0000d231816abba584714c9e",
                "__v": 1,
                "updatedAt": "2017-05-08T09:34:01.818Z",
                "createdAt": "2017-05-08T09:34:01.818Z",
                "callbacks": [],
                "stateHistory": [
                    {
                        "state": "created"
                    }
                ],
                "state": "escalated"
            },
            {
                "_id": "59103bdfe249634cc8462cd4",
                "message": {
                    "priority": "medium",
                    "scopeIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "userIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "createdAt": "2017-05-08T09:35:27.402Z",
                    "updatedAt": "2017-05-08T09:35:27.402Z",
                    "_id": "59103bdfe249634cc8462cd3",
                    "applicationId": "0000d231816abba584714c9e",
                    "body": "Wap Bap",
                    "title": "sdfsfsdfsdf22222",
                    "__v": 0
                },
                "user": "0000d231816abba584714c9e",
                "__v": 1,
                "updatedAt": "2017-05-08T09:35:27.446Z",
                "createdAt": "2017-05-08T09:35:27.446Z",
                "callbacks": [],
                "stateHistory": [
                    {
                        "state": "created"
                    }
                ],
                "state": "escalated"
            },
            {
                "_id": "59103c48e249634cc8462cdb",
                "message": {
                    "priority": "medium",
                    "scopeIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "userIds": [
                        "0000d231816abba584714c9e"
                    ],
                    "createdAt": "2017-05-08T09:37:12.579Z",
                    "updatedAt": "2017-05-08T09:37:12.579Z",
                    "_id": "59103c48e249634cc8462cda",
                    "applicationId": "0000d231816abba584714c9e",
                    "body": "Wap Bap",
                    "title": "sdfsfsdfsdf22222",
                    "__v": 0
                },
                "user": "0000d231816abba584714c9e",
                "__v": 1,
                "updatedAt": "2017-05-08T09:37:12.633Z",
                "createdAt": "2017-05-08T09:37:12.633Z",
                "callbacks": [],
                "stateHistory": [
                    {
                        "state": "created"
                    }
                ],
                "state": "escalated"
            }
        ]
    });

    Promise.all([
        notificationsPromise
    ]).then(([notifications]) => {
        res.locals.notifications = (notifications.data || []).reverse().map(notification => {
            notification = notification.message;
            notification.date = new Date(notification.createdAt);  // make new date out of iso string

            if(moment.duration(moment(new Date()).diff(moment(notification.date))).asHours() < 5) {
                res.locals.recentNotification = true;
            }

            return notification;
        });

        next();
    });
};
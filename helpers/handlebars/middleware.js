const url = require('url');
const moment = require('moment');
const api = require('../../api');

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

        if(item.children && item.childActive) {
            item.children = makeActive(item.children, currentUrl);

            if(item.children.filter(child => {return child.class == 'active';}).length == 0){
                item.class += ' active';
            }
        }

        return item;
    });
};

module.exports = (req, res, next) => {
    res.locals.themeTitle = process.env.SC_NAV_TITLE || 'Schul-Cloud';
    res.locals.backendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030';
    // standard views
    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
    }, {
        name: 'Neuigkeiten',
        icon: 'newspaper-o',
        link: '/news/'
    }, {
        name: 'Kurse',
        icon: 'graduation-cap',
        link: '/courses/'
    }, {
        name: 'Termine',
        icon: 'table',
        link: '/calendar/'
    }, {
        name: 'Aufgaben',
        icon: 'tasks',
        link: '/homework/',
        children: [
            {
                name: 'Gestellte Aufgaben',
                icon: 'bullhorn',
                link: '/homework/asked/'
            },
            {
                name: 'Meine Aufgaben',
                icon: 'lock',
                link: '/homework/private/'
            },
            {
                name: 'Archiv',
                icon: 'archive',
                link: '/homework/archive/'
            }
        ]
    }, {
        name: 'Meine Dateien',
        icon: 'folder-open',
        link: '/files/',
        children: [
            {
                name: 'persönliche Dateien',
                icon: 'folder-open-o',
                link: '/files/my/'
            },
            {
                name: 'Kurse',
                icon: 'folder-open-o',
                link: '/files/courses/'
            },
            {
                name: 'geteilte Dateien',
                icon: 'folder-open-o',
                link: '/files/shared/'
            }
        ]
    }];

    // teacher views
    res.locals.sidebarItems.push({
        name: 'Verwaltung',
        icon: 'cogs',
        link: '/administration/',
        permission: 'STUDENT_CREATE',
        children: [
            {
                name: 'Schüler',
                icon: 'odnoklassniki',
                link: '/administration/students/',
            },
            {
                name: 'Lehrer',
                icon: 'odnoklassniki',
                link: '/administration/teachers/',
            },
            {
                name: 'Klassen',
                icon: 'users',
                link: '/classes/'
            }
        ]
    });

    // helpdesk views
    res.locals.sidebarItems.push({
       name: 'Helpdesk',
       icon: 'cogs',
       link: '/administration/helpdesk/',
       permission: 'HELPDESK_VIEW'
    });

    // admin views
    res.locals.sidebarItems.push({
        name: 'Administration',
        icon: 'cogs',
        link: '/administration/',
        permission: 'ADMIN_VIEW',
        children: [
            {
                name: 'Schüler',
                icon: 'odnoklassniki',
                link: '/administration/students/'
            },
            {
                name: 'Lehrer',
                icon: 'odnoklassniki',
                link: '/administration/teachers/'
            },
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
                name: 'Authentifizierung',
                icon: 'key',
                link: '/administration/systems/'
            }
        ]
    });

    // beta user view
    res.locals.sidebarItems.push({
       name: 'Lernstore',
       icon: 'book',
       link: '/content/',
			 children: [
					 {
							 name: 'Suche',
							 icon: 'search',
							 link: '/content/search/'
					 },
					 {
							 name: 'Meine Materialien',
							 icon: 'file',
							 link: '/content/my-content/'
					 },
					 {
							 name: 'Erstellen',
							 icon: 'edit',
							 link: '/content/create/'
					 },
					 {
							 name: 'Review',
							 icon: 'check',
							 link: '/content/review/'
					 }
			 ]
    });

    makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

    let notificationsPromise = [];
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        notificationsPromise = api(req).get('/notification', {
            qs: {
                $limit: 10,
                $sort: "-createdAt"
            }
        }).catch(_ => []);
        }
    let notificationCount = 0;

    Promise.all([
            notificationsPromise
        ]).then(([notifications]) => {
            res.locals.notifications = (notifications.data || []).map(notification => {
                const notificationId = notification._id;
                const callbacks = notification.callbacks || [];

                notification = notification.message;
                notification.notificationId = notificationId;

                notification.date = new Date(notification.createdAt);  // make new date out of iso string

                notification.read = false;
                callbacks.forEach(callback => {
                    if (callback.type === "read")
                        notification.read = true;
                });

                if (!notification.read) {
                    notificationCount++;
                }

                return notification;
            });
            res.locals.recentNotifications = notificationCount;
            next();
        });
};

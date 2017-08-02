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

        if(item.children) {
            makeActive(item.children, currentUrl);
        }

        return item;
    });
};

module.exports = (req, res, next) => {
    // standard views
    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
    }, {
        name: 'Fächer / Kurse',
        icon: 'graduation-cap',
        link: '/courses/'
    },
    {
        name: 'Klassen',
        icon: 'odnoklassniki',
        link: '/classes/'
    },
        {
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

    // teacher views
    res.locals.sidebarItems.push({
        name: 'Verwaltung',
        icon: 'cogs',
        link: '/administration/',
        permission: 'STUDENT_CREATE',
        children: [
            {
                name: 'Schüler',
                icon: 'users',
                link: '/administration/students/',
            },
            {
                name: 'Lehrer',
                icon: 'users',
                link: '/administration/teachers/',
            },
        ]
    });

    // admin views
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

    const notificationsPromise = api(req).get('/notification', {qs: { $limit: 10, $sort: "-createdAt" }}).catch(_ => []);
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
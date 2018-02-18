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
    res.locals.themeTitle = process.env.SC_TITLE || 'Schul-Cloud';
    // standard views
    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
        step: "10",
        intro: "Hiermit gelangen sie stets auf ihr persönliches Dashboard zurück, auf welchem Sie auch direkt nach dem Login landen."
    }, {
        name: 'Neuigkeiten',
        icon: 'newspaper-o',
        link: '/news/',
        step: "11",
        intro: "Hier können Sie noch einmal auf Ihre Neuigkeiten zugreifen und auch ältere Neuigkeiten einsehen."
    }, {
        name: 'Kurse',
        icon: 'graduation-cap',
        link: '/courses/',
        step: "12",
        intro: "Hier gelangen Sie zu ihren Kursen, die sie einsehen, verwalten und neu anlegen können."
    }, {
        name: 'Klassen',
        icon: 'odnoklassniki',
        link: '/classes/',
        step: "13",
        intro: "Hier können Sie ihre Klassen einsehen, verwalten oder eine neue Klasse erstellen."
    }, {
        name: 'Termine',
        icon: 'table',
        link: '/calendar/',
        step: "14",
        intro: "Hier haben Sie Einsicht in Ihren persönlichen Kalender. In diesem sind bisher Ihre persönlichen Unterrichtsstunden verfügbar, sowie Termine, die zusätzlich anfallen, wie z.B. AGs oder Fachkonferenzen."
    }, {
        name: 'Aufgaben',
        icon: 'tasks',
        link: '/homework/',
        step: "15",
        intro: "Hier gelangen Sie zur Aufgabenübersicht. Unter diesem Menüpunkt finden Sie die von Ihnen gestellten Aufgaben, ihre persönlichen Aufgaben sowie das Aufgabenarchiv. Sie können außerdem die Status der einzelnen Aufgaben einsehen und ihren Schüler*innen Feedback geben.",
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
        step: "16",
        intro: "Hier gelangen Sie zu ihren Dateien, die Sie in der Schul-Cloud uploaden können. Sie haben an dieser Stelle die Möglichkeit zwischen Ihren persönlichen Dateien, Kursdateien und mit Ihnen geteilten Dateien zu wählen.",
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
    }, {
        name: 'Materialien',
        icon: 'search',
        link: '/content/',
        step: "17",
        intro: "Hier gelangen Sie zur Materialsuche, bei der Sie in der Datenbank der Schul-Cloud nach Materialien für Ihre Unterrichtsstunde suchen können."
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
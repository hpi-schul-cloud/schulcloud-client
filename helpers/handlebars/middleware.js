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
        } else if (currentUrl.match(regex)) {
            if (item.children) {
                item.class = 'child-active';
            } else {
                item.class = 'active';
            }
            item.childActive = true;
        }

        if (item.children && item.childActive) {
            item.children = makeActive(item.children, currentUrl);

            if (item.children.filter(child => { return child.class == 'active'; }).length == 0) {
                item.class += ' active';
            }
        }

        return item;
    });
};

module.exports = (req, res, next) => {
    res.locals.backendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:3030';
    // standard views
    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
        introNumber: 11,
        introText: "Hiermit gelangst du stets zu deinem persönlichen Dashboard zurück, auf welchem du auch direkt nach dem Login landest."
    }, {
        name: 'Kurse',
        icon: 'graduation-cap',
        link: '/courses/',
        introNumber: 13,
        introText: "Hier gelangst du zu deinen Kursen, die du einsehen, verwalten und neu anlegen kannst."
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
                name: 'Meine ToDos',
                icon: 'lock',
                link: '/homework/private/'
            },
            {
                name: 'Archiv',
                icon: 'archive',
                link: '/homework/archive/'
            }
        ],
        introNumber: 15,
        introText: "Hier gelangst du zur Aufgabenübersicht. Unter diesem Menüpunkt findest du die von dir gestellten Aufgaben, deine persönlichen Aufgaben sowie das Aufgabenarchiv. Du kannst außerdem die Status der einzelnen Aufgaben einsehen und deinen Schülern Feedback geben."
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
        ],
        introNumber: 16,
        introText: "Hier gelangst du zum Dateibereich, in dem du Dateien hochladen und verwalten kannst. Deine Dateien werden hierbei in folgende Kategorien unterteilt: deine persönlichen Dateien, Kursdateien und mit dir geteilte Dateien."
    }, {
        name: 'Neuigkeiten',
        icon: 'newspaper-o',
        link: '/news/',
        introNumber: 12,
        introText: "Hier kannst du noch einmal auf deine Neuigkeiten zugreifen und auch ältere Neuigkeiten einsehen."
    }, {
        name: 'Termine',
        icon: 'table',
        link: '/calendar/',
        introNumber: 14,
        introText: "Hier hast du Einsicht in deinen persönlichen Kalender. In diesem sind bisher deine Unterrichtsstunden verfügbar, sowie Termine, die zusätzlich anfallen, wie z.B. AGs oder Fachkonferenzen."
    }, {
        name: 'Lern-Store',
        icon: 'search',
        link: '/content/',
        introNumber: 17,
        introText: "Hier gelangst du zur Materialsuche, bei der du in der Datenbank der Schul-Cloud nach Materialien für deine Unterrichtsstunde suchen kannst."
    }];

    // Extensions Feature Toggle
    const extensionsEnabled = process.env.FEATURE_EXTENSIONS_ENABLED === 'true';
    if (extensionsEnabled) {
      res.locals.sidebarItems.push({
        name: "Add-ons",
        icon: "puzzle-piece",
        link: "/addons"
      });
    }

    // teacher views
    res.locals.sidebarItems.push({
        name: 'Verwaltung',
        icon: 'cogs',
        link: '/administration/',
        permission: 'STUDENT_LIST',
        excludedPermission: 'ADMIN_VIEW',
        children: [
            {
                name: 'Schüler',
                icon: 'odnoklassniki',
                link: '/administration/students/',
            },
            {
                name: 'Lehrer',
                icon: 'user',
                link: '/administration/teachers/',
            },
            {
                name: 'Klassen',
                icon: 'users',
                link: '/administration/classes/',
            }
        ]
    });

    // helpdesk views
    res.locals.sidebarItems.push({
        name: 'Helpdesk',
        icon: 'ticket',
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
                icon: 'user',
                link: '/administration/teachers/'
            },
            {
                name: 'Kurse',
                icon: 'graduation-cap',
                link: '/administration/courses/'
            },
            {
                name: 'Klassen',
                icon: 'users',
                link: '/administration/classes/'
			},
			{
                name: 'Teams',
                icon: 'users',
                link: '/administration/teams/'
            },
            {
                name: 'Schule',
                icon: 'building',
                link: '/administration/school/'
            },
        ]
    });

    // beta user view
    res.locals.sidebarItems.push({
        name: 'Meine Materialien',
        icon: 'book',
        link: '/my-material/',
        permission: 'BETA_FEATURES'
    });

    // team feature toggle
    const teamsEnabled = process.env.FEATURE_TEAMS_ENABLED === 'true';
    if (teamsEnabled) {
        res.locals.sidebarItems.splice(2, 0, {
            name: 'Teams',
            icon: 'users',
            link: '/teams/',
            introNumber: 13,
            introText: 'Hier gelangst du zu deinen Teams, die du einsehen, verwalten und neu anlegen kannst.',
        });
        res.locals.sidebarItems.find(i => i.name === 'Meine Dateien').children.splice(2, 0, {
            name: 'Teams',
            icon: 'folder-open-o',
            link: '/files/teams/',
        });
        /*
        res.locals.sidebarItems.find(i => i.name === 'Administration').children.splice(4, 0, {
            name: 'Teams',
            icon: 'users',
            link: '/administration/teams/',
        });
        */
    }

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

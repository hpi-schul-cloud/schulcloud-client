const url = require('url');

const makeActive = (items, currentUrl) => {
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
                name: 'Kurse',
                icon: 'folder-open-o',
                link: '/files/courses/'
            },
            {
                name: 'Klassen',
                icon: 'folder-open-o',
                link: '/files/classes/'
            },
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
            }
        ]
    });

     makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

    next();
};
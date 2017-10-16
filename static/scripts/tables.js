$(document).ready(function () {

    const dictionary = {
    'Vorname': 'firstName',
    'Nachname': 'lastName',
    'E-Mail': 'email',
    'Rollen': 'roles',
    'Rolen': 'roles',
    'Schule': 'schoolId',
    'Name': 'name',
    'ID': '_id',
    'Bundesland': 'federalState',
    'Permissions': 'permissions',
    'Geerbt von': 'roles',
    'Titel': 'subject',
    'Kategorie': 'category',
    'Ist-Zustand': 'currentState',
    'Soll-Zustand': 'targetState',
    'Status': 'state',
    'Anmerkungen': 'notes',
    'Abkürzung': 'abbreviation',
    'Logo': 'logoUrl',
    'E-Mail-Adresse': 'email',
    'Klassen': 'classIds',
    'Lehrer': 'teacherIds',
    'Klasse(n)': 'classIds',
    'Bezeichnung': 'name',
    'Typ': 'type',
    'Url': 'url',
    'Alias': 'alias'
};

$('tr th').each(function(i,j) {
    $(j).on('click', function (e) {

        let location = window.location.search.split('&');
        let contained = false;

        location = location.map(entity => {
            if (entity.includes('sort')) {
                if (entity === 'sort=' + dictionary[$(j).text()]) {
                    entity = 'sort=-' + dictionary[$(j).text()]
                } else {
                    entity = 'sort=' + dictionary[$(j).text()];
                }
                contained = true;
            }
            return entity;
        });
        if (!contained)
            location.push('sort=' + dictionary[$(j).text()]);
        window.location.search = location.join('&');
    });
});



});
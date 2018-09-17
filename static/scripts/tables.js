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
    'Erstellungsdatum': 'createdAt',
    'Anmerkungen': 'notes',
    'Abkürzung': 'abbreviation',
    'Logo': 'logoUrl',
    'E-Mail-Adresse': 'email',
    'Klasse': 'displayName',
    'Klassen': 'classIds',
    'Klasse(n)': 'classIds',
    'Lehrer': 'teacherIds',
    'Bezeichnung': 'name',
    'Typ': 'type',
    'Url': 'url',
    'Alias': 'alias',

    'subject': 'Titel',
    'firstName': 'Vorname',
    'lastName': 'Nachname',
    'roles': 'Rollen',
    'schoolId': 'Schule',
    'name': 'Name',
    '_id': 'ID',
    'federalState': 'Bundesland',
    'category': 'Kategorie',
    'currentState': 'Ist-Zustand',
    'targetState': 'Soll-Zustand',
    'state': 'Status',
    'createdAt': 'Erstellungsdatum',
    'notes': 'Anmerkungen',
    'logoUrl': 'Logo',
    'abbreviation': 'Abkürzung',
    'type': 'Typ',
    'url': 'Url',
    'alias': 'Alias',
    'permissions': 'Permissions',
    'teacherIds': 'Lehrer',
    'classIds': 'Klasse(n)',
    'displayName': 'Klasse',
    'email': 'E-Mail-Adresse'
};

$('tr th').each(function(i,j) {
    $(j).on('click', function (e) {

        let location = window.location.search.split('&');
        let contained = false;

        location = location.map(entity => {
            if (entity.includes('sort')) {
                if (entity === 'sort=' + dictionary[$(j).text()]) {
                    entity = 'sort=-' + dictionary[$(j).text()];
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

$('#limit').change(function changeLimit() {

    let location = window.location.search.split('&');
    let contained = false;

    location = location.map(entity => {
        if (entity.includes('limit')) {
            entity = 'limit=' + $('#limit').val();
            contained = true;
        }
        return entity;
    });
    if (!contained)
        location.push('limit=' + $('#limit').val());
    window.location.search = location.join('&');
});

let location = window.location.search.split('&');
location.map(entity => {
   if (entity.includes('sort')) {
       let queryParam = entity.split('=');
       queryParam = queryParam[1].toString();

       let asc = true;

       if (queryParam.charAt(0) === '-') {
           asc = false;
           queryParam = queryParam.slice(1);
       }

       if (asc) {
           $('th:contains(' + dictionary[queryParam] + ')').append('<i class="fa fa-arrow-down" aria-hidden="true"></i>');
       } else {
           $('th:contains(' + dictionary[queryParam] + ')').append('<i class="fa fa-arrow-up" aria-hidden="true"></i>');
       }
   }
});
});
$(document).ready(function () {
    let url = window.location.href.includes('schul-cloud') ? 'https://schul-cloud.org:8080' : 'http://127.0.0.1:3030' ;
    let socket = io(url);
    let client = feathers()
        .configure(feathers.socketio(socket));

    socket.on('newReleaseAvailable', (res) => {
        if (res.bool) {
            $.ajax({
                type: "POST",
                url: "/account/preferences",
                data: { attribute: { key: "releaseDate", value: res.createdAt } }
            });
            $('.feature-modal').modal('show');
        }
    });
});
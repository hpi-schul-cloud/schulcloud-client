$(document).ready(function () {
    let url = window.location.href.includes('localhost') ? 'http://localhost:3030' : 'https://schul-cloud.org:8080';
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
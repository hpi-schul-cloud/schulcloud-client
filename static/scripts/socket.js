$(document).ready(function () {
    let socket = io('http://localhost:3030');
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
$(document).ready(function () {
    let socket = io('https://schul-cloud.org:8080');
    let client = feathers()
        .configure(feathers.socketio(socket));

    socket.on('releaseTrigger', (res) => {
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
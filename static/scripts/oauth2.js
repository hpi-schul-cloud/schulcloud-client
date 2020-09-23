$(document).ready(() => {
    document.hasStorageAccess().then(hasAccess => {
        if (!hasAccess) {
            $(document).on('mousemove', () => {
                document.requestStorageAccess().then(() => window.location.reload());
            });
        };
    });
});
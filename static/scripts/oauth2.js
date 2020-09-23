$(document).ready(() => {
    document.hasStorageAccess().then(hasAccess => {
        if (!hasAccess) {
            $(document).on('click', () => {
                document.requestStorageAccess().then(() => window.location.reload());
            });
        };
    });
});
const userHasPermission = (user, permissions) => {
    if(!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    if(!user) return false;

    const userPermissions = user.permissions || [];
    return permissions.every((permission) => {
        return userPermissions.includes(permission);
    });
};

module.exports = {
    userHasPermission,
    permissionsChecker: (permission) => (req, res, next) => {
        if(userHasPermission(res.locals.currentUser, permission)) {
            return next();
        }

        const error = new Error('Not authorized');
        error.status = 401;
        return next(error);
    }
};

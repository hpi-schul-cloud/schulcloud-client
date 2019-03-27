const request = require('request');
var rp = require('request-promise');
const defaults = require('./defaults');

const api = (req, { useCallback = false, json = true } = {}) => {
    const headers = {};
    if (req && req.cookies && req.cookies.jwt) {
        headers['Authorization'] = (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") + req.cookies.jwt;
    }

    const handler = useCallback ? request : rp;
    return handler.defaults({
        baseUrl: defaults.BACKEND_URL,
        json,
        headers
    });
};

module.exports = api;

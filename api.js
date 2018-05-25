const request = require('request');
var rp = require('request-promise');

const api = (req, {useCallback = false, json = true} = {}) => {
    const headers = {};
    headers['X-API-TOKEN'] = process.env.XAPITOKEN || 'example';
    if(req && req.cookies && req.cookies.jwt) {
        headers['Authorization'] = req.cookies.jwt;
    }

    const handler = useCallback ? request : rp;
    return handler.defaults({
        baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/',
        json,
        headers
    });
};

module.exports = api;
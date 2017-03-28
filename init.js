/**
 * Module dependencies.
 */

const fs = require('fs');
const express = require('express');
const router = express.Router();

module.exports = (app, options) => {
    // load all modules
    fs.readdirSync(__dirname + '/modules').forEach(function(name) {
        if (!fs.existsSync(__dirname + '/modules/' + name + '/index.js')) return;

        const module = require(__dirname + '/modules/' + name);

        // mount the app
        app.use(module.router);
    });
};
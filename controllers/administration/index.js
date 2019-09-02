const express = require('express');

const router = express.Router();

router.use('/datasources/', require('./datasources'));
router.use('/', require('./other'));

module.exports = router;

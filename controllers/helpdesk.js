const express = require('express');
const router = express.Router();
const api = require('../api');

// secure routes
router.use(require('../helpers/authentication').authChecker);

router.post('/', function (req, res, next) {
    let body = req.body;
    api(req).post('/mails', {
        json: {
          email: 'schul-cloud-support@hpi.de',
          subject: 'Feedback ' + body.title,
          content: { text: body.email + "\n" + body.message}
        }
    }).then(() =>  {
        res.redirect(req.header('Referer'));
    });
});

module.exports = router;

const express = require("express");
const router = express.Router();

const authHelper = require("../helpers/authentication");
const permissionsHelper = require("../helpers/permissions");
const api = require("../api");

// secure routes
router.use(authHelper.authChecker);

router.get("/", function(req, res, next) {
  res.render("firstLogin/firstLogin", {
    title: "Willkommen - Erster Login",
    hideMenu: true
  });
});
router.get("/14_17", function(req, res, next) {
  res.render("firstLogin/firstLogin14_17", {
    title: "Willkommen - Erster Login (14 bis 17 Jahre)",
    hideMenu: true,
    sso: (res.locals.currentPayload || {}).systemId ? true : false
  });
});
router.get("/U14", function(req, res, next) {
  res.render("firstLogin/firstLoginU14", {
    title: "Willkommen - Erster Login",
    hideMenu: true,
    sso: (res.locals.currentPayload || {}).systemId ? true : false
  });
});
router.get("/UE18", function(req, res, next) {
  res.render("firstLogin/firstLoginUE18", {
    title: "Willkommen - Erster Login",
    hideMenu: true,
    sso: (res.locals.currentPayload || {}).systemId ? true : false
  });
});
router.get("/existing", function(req, res, next) {
  res.render("firstLogin/firstLoginExistingUser", {
    title: "Willkommen - Erster Login für bestehende Nutzer",
    hideMenu: true
  });
});
router.post("/submit", function(req, res, next) {
  if (req.body["password-1"] !== req.body["password-2"]) {
    return Promise.reject(
      new Error("Die neuen Passwörter stimmen nicht überein.")
    ).catch(err => {
      res.status(500).send(err.message);
    });
  }

  let accountId = res.locals.currentPayload.accountId;
  let accountUpdate = {};
  let accountPromise = Promise.resolve();
  let userUpdate = {};
  let userPromise;
  let consentUpdate = {};
  let consentPromise = Promise.resolve();

  if (req.body["password-1"]) {
    accountUpdate.password_verification = req.body.password_verification;
    accountUpdate.password = req.body["password-1"];
    accountPromise = api(req).patch("/accounts/" + accountId, {
      json: accountUpdate
    });
  }

  // wrong birthday object?
  if (req.body.studentBirthdate) {
    let dateArr = req.body.studentBirthdate.split(".");
    let userBirthday = new Date(`${dateArr[1]}.${dateArr[0]}.${dateArr[2]}`);
    if (userBirthday instanceof Date && isNaN(userBirthday)) {
      res.status(500).send("Bitte einen validen Geburtstag auswählen.");
    }
    userUpdate.birthday = userBirthday;
  }
  // malformed email?
  if (req.body["student-email"]) {
    var regex = RegExp(
      "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
    );
    if (!regex.test(req.body["student-email"])) {
      res.status(500).send("Bitte eine valide E-Mail-Adresse eingeben.");
    } else {
      userUpdate.email = req.body["student-email"];
    }
  }

  let preferences = res.locals.currentUser.preferences || {};
  preferences.firstLogin = true;
  userUpdate.preferences = preferences;

  userPromise = api(req).patch("/users/" + res.locals.currentPayload.userId, {
    json: userUpdate
  });

  if (
    req.body.privacyConsent ||
    req.body.thirdPartyConsent ||
    req.body.termsOfUseConsent ||
    req.body.researchConsent
  ) {
    consentPromise = api(req)
      .get("/consents/", {
        qs: { userId: res.locals.currentPayload.userId }
      })
      .then(consent => {
        consentUpdate.form = "digital";
        consentUpdate.privacyConsent = req.body.privacyConsent;
        consentUpdate.thirdPartyConsent = req.body.thirdPartyConsent;
        consentUpdate.termsOfUseConsent = req.body.termsOfUseConsent;
        consentUpdate.researchConsent = req.body.researchConsent;
        return api(req).patch("/consents/" + consent.data[0]._id, {
          json: { userConsent: consentUpdate }
        });
      });
  }

  return Promise.all([accountPromise, userPromise, consentPromise])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => {
      res
        .status(500)
        .send(
          (err.error || err).message ||
            "Ein Fehler ist bei der Verarbeitung der FirstLogin Daten aufgetreten."
        );
    });
});
router.get("/existingU14", function(req, res, next) {
  res.render("firstLogin/firstLoginExistingUserU14", {
    title: "Willkommen - Erster Login für bestehende Nutzer",
    hideMenu: true
  });
});
router.get("/existingUE14", function(req, res, next) {
  res.render("firstLogin/firstLoginExistingUserUE14", {
    title: "Willkommen - Erster Login für bestehende Nutzer",
    hideMenu: true
  });
});
router.get("/existingGeb14", function(req, res, next) {
  res.render("firstLogin/firstLoginExistingGeb14", {
    title: "Willkommen - Erster Login",
    hideMenu: true
  });
});
router.get("/existingEmployee", function(req, res, next) {
  res.render("firstLogin/firstLoginExistingEmployee", {
    title: "Willkommen - Erster Login",
    hideMenu: true
  });
});
router.get("/consentError", function(req, res, next) {
  res.render("firstLogin/consentError");
});

module.exports = router;

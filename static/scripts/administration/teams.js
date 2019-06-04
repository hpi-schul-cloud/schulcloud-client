// eslint-disable-next-line func-names
$(window).ready(() => {
  function getPayload(tableRow) {
    var json = tableRow.find("td[data-payload]").data("payload");
    return json;
  }

  function displayModalTeamMembers(headline, content) {
    var $memberModal = $(".member-modal");

    populateModal($memberModal, ".modal-title", headline);
    populateModal($memberModal, "#member-modal-body", content);

    $memberModal.appendTo("body").modal("show");
  }

  $(".btn-show-members").on("click", function showMemebers(e) {
    e.preventDefault();
    var test = $(this)[0];
    var parent = $(this).closest("tr");
    var members = getPayload(parent).members;

    var teamMembers = "Keine Teilnehmer";
    if ((members || []).length != 0) {
      teamMembers = "<ol>";
      members.forEach(member => {
        const user = member.user; // userId was populated
        if (user.displayName) {
          teamMembers =
            teamMembers +
            "<li>" +
            user.displayName +
            " (" +
            member.role +
            ")</li>";
        } else {
          teamMembers =
            teamMembers +
            "<li>" +
            user.firstName +
            " " +
            user.lastName +
            " (" +
            member.role +
            ")</li>";
        }
      });
      teamMembers = teamMembers + "</ol>";
    }

    displayModalTeamMembers("Mitglieder an eigener Schule", teamMembers);
  });

  $(".btn-show-schools").on("click", function showMemebers(e) {
    e.preventDefault();
    var test = $(this)[0];
    var parent = $(this).closest("tr");
    var schools = getPayload(parent).schools;

    var teamSchools = "Keine Schulen";
    if ((schools || []).length != 0) {
      teamSchools = "<ol>";
      schools.forEach(member => {
        teamSchools += "<li>" + member.name + "</li>";
      });
      teamSchools = teamSchools + "</ol>";
    }

    displayModalTeamMembers("Schulen", teamSchools);
  });

  $(".btn-write-owner").on("click", function writeOwner(e) {
    e.preventDefault();
    // e.stopPropagation();

    var $messageModal = $(".message-owner-modal");

    var entry = $(this).attr("href");

    populateModalForm($messageModal, {
      action: entry,
      title: "Nachricht schreiben",
      closeLabel: "Abbrechen",
      submitLabel: "Absenden"
    });

    $messageModal.appendTo("body").modal("show");
  });

  $(".btn-delete-team").on("click", function deleteTeam(e) {
    e.preventDefault();

    var $deleteModal = $(".delete-team-modal");

    var entry = $(this).attr("href");
    var name = $(this).attr("data-name");

    populateModalForm($deleteModal, {
      action: entry,
      title: "Löschen",
      closeLabel: "Abbrechen",
      submitLabel: "Löschen",
      fields: {
        name
      }
    });

    $deleteModal.appendTo("body").modal("show");
  });

  $(".btn-remove-members").on("click", function removeMembers(e) {
    e.preventDefault();

    var $removeModal = $(".remove-members-modal");

    var entry = $(this).attr("href");
    var name = $(this).attr("data-name");

    populateModalForm($removeModal, {
      action: entry,
      title: "Schule aus Team entfernen",
      closeLabel: "Abbrechen",
      submitLabel: "Enternen",
      fields: {
        name
      }
    });

    $removeModal.appendTo("body").modal("show");
  });

  $(".btn-set-teamowner").on("click", function removeMembers(e) {
    e.preventDefault();

    var $removeModal = $(".select-owner-modal");

    var entry = $(this).attr("href");
    var name = $(this).attr("data-name");

    populateModalForm($removeModal, {
      action: entry,
      title: "Person als Eigentümer festlegen",
      closeLabel: "Abbrechen",
      submitLabel: "Ernennen"
    });

    $removeModal.appendTo("body").modal("show");
  });
});

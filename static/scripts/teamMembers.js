$(document).ready(function () {
  
  const $inviteExternalMemberModal = $('.invite-external-member-modal');
  const $inviteLinkModal = $('.invitation-modal');

  /////////////
  // Add Member
  /////////////
  $('.btn-add-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $addMemberModal = $('.add-member-modal');
    populateModalForm($addMemberModal, {
        title: 'Mitglieder hinzufügen',
        closeLabel: 'Abbrechen',
        submitLabel: 'Mitglieder hinzufügen'
    });

    let $modalForm = $addMemberModal.find(".modal-form");
    $addMemberModal.appendTo('body').modal('show');
  });

  $('.add-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();

    let newUserIds = $('.add-member-modal form select').val();

    $.ajax({
      url: $(this).attr('action'),
      method: 'PATCH',
      data: {
        newUserIds
      }
    }).done(function() {
      $.showNotification('Mitglieder erfolgreich zum Team hinzugefügt', "success", true);
      location.reload();
    }).fail(function() {
      $.showNotification('Problem beim Hinzufügen der Mitglieder', "danger", true);
    });

    return false;
  });

  /////////////
  // Add external Member
  /////////////
  $('.btn-invite-external-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $inviteExternalMemberModal = $('.invite-external-member-modal');
    populateModalForm($inviteExternalMemberModal, {
        title: 'Externes Mitglied einladen',
        closeLabel: 'Abbrechen',
        submitLabel: 'Mitglied einladen'
    });

    let $modalForm = $inviteExternalMemberModal.find(".modal-form");
    $inviteExternalMemberModal.appendTo('body').modal('show');
  });

  $('.invite-external-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();
    let email = $(this).find('#email').val() || "";
    let role = $(this).find('#role').val() || "member";
    let teamId = $inviteExternalMemberModal.find(".modal-form .form-group").attr('data-teamId');
    let origin = window.location.origin;
    console.log({email, role, teamId, origin});
    $.ajax({
        type: "POST",
        url: origin+"/teams/invitelink",
        data: {
            host: origin,
            role: role,
            teamId: teamId,
            invitee: email
        },
        success: function(linkData) {
            console.log("linkData");
            console.log(linkData);
            populateModalForm($inviteLinkModal, {
                title: 'Einladungslink generiert!',
                closeLabel: 'Abbrechen',
                submitLabel: 'Speichern',
                fields: {invitation: linkData.shortLink}
            });
            $inviteLinkModal.find('.btn-submit').remove();
            $inviteLinkModal.find("input[name='invitation']").click(function () {
                $(this).select();
            });
            $inviteExternalMemberModal.modal('hide');
            $inviteLinkModal.appendTo('body').modal('show');
        }
    });
    return false;
  });

  /////////////
  // Resend invitation
  /////////////
  $('.btn-resend-invitation').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    $.showNotification('Einladung wurde verschickt', "success", true);
  });

  /////////////
  // Delete Member
  /////////////
  $('.btn-delete-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $deleteMemberModal = $('.delete-member-modal');
    const userIdToRemove = $(this).parent().parent().find('[data-payload]').data('payload');
    populateModalForm($deleteMemberModal, {
        title: 'Mitglied löschen',
        closeLabel: 'Abbrechen',
        submitLabel: 'Mitglied löschen',
        payload: userIdToRemove
    });

    let $modalForm = $deleteMemberModal.find(".modal-form");
    $deleteMemberModal.appendTo('body').modal('show');
  });

  $('.delete-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const userIdToRemove = $(this).data('payload').userId;

    $.ajax({
      url: $(this).attr('action'),
      method: 'DELETE',
      data: {
        userIdToRemove
      }
    }).done(function() {
      location.reload();
    }).fail(function() {
      // ToDo: Error handling
    });

    return false;
  });
});
$(document).ready(function () {
  let handler = {
    get: function (target, name) {
      return name in target ?
        target[name] :
        '';
    },
    set: function (obj, prop, value) {
      obj[prop] = value;
      if (['role', 'method'].includes(prop)) {
        renderInviteModal();
      }
    }
  };

  let state = new Proxy({
    role: 'teacher',
    method: 'directory',
    currentInvitationEmail: ''
  }, handler);

  const $inviteExternalMemberModal = $('.invite-external-member-modal');

  /////////////
  // Add Member
  /////////////
  $('.btn-add-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $addMemberModal = $('.add-member-modal');
    populateModalForm($addMemberModal, {
      title: 'Teilnehmer hinzufügen',
      closeLabel: 'Abbrechen',
      submitLabel: 'Teilnehmer hinzufügen'
    });

    let $modalForm = $addMemberModal.find(".modal-form");
    $addMemberModal.appendTo('body').modal('show');
  });

  $('.add-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();

    let userIds = $('.add-member-modal form .form-users select').val();
    userIds = userIds.map(userId => {
      return { userId };
    });

    let classIds = $('.add-member-modal form .form-classes select').val();

    $.ajax({
      url: $(this).attr('action'),
      method: 'POST',
      data: {
        userIds,
        classIds
      }
    }).done(function () {
      $.showNotification('Teilnehmer erfolgreich zum Team hinzugefügt', "success", true);
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Hinzufügen der Teilnehmer', "danger", true);
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
      title: 'Externen Teilnehmer einladen',
      closeLabel: 'Abbrechen',
      submitLabel: 'Teilnehmer einladen'
    });

    $('#federalstate').trigger('change');

    let $modalForm = $inviteExternalMemberModal.find(".modal-form");
    $inviteExternalMemberModal.appendTo('body').modal('show');
  });

  function renderInviteModal() {
    $(`.btn-set-role[data-role]`).removeClass('btn-primary');
    $(`.btn-set-role[data-role]`).addClass('btn-secondary');
    $(`.btn-set-role[data-role='${state.role}']`).removeClass('btn-secondary');
    $(`.btn-set-role[data-role='${state.role}']`).addClass('btn-primary');

    $(`.form-group[data-role]`).hide();
    $(`.form-group[data-role='${state.role}']`).show();

    $(`.btn-set-method[data-method]`).removeClass('btn-primary');
    $(`.btn-set-method[data-method]`).addClass('btn-secondary');
    $(`.btn-set-method[data-method='${state.method}']`).removeClass('btn-secondary');
    $(`.btn-set-method[data-method='${state.method}']`).addClass('btn-primary');

    $(`.form-group[data-method]`).hide();
    $(`.form-group[data-method='${state.method}']`).show();
  }

  renderInviteModal();

  $('.btn-set-role').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    state.role = this.getAttribute("data-role");
    return false;
  });

  $('.btn-set-method').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    state.method = this.getAttribute("data-method");
    return false;
  });

  const populateSchools = (federalState) => {
    $.ajax({
      type: "GET",
      url: window.location.origin + "/schools",
      data: {
        federalState
      }
    }).done(schools => {
      let schoolSelect = $('#school');
      schoolSelect.find('option').remove();
      schools.forEach(school => {
        schoolSelect.append(`<option value="${school._id}">${school.name}</option>`);
      });
      schoolSelect.trigger("chosen:updated");
      $('#school').trigger('change');
    }).fail(function () {
      $.showNotification('Problem beim Auslesen der Schulen', "danger", true);
      $('#teacher').find('option').remove();
    });
  };

  $('#federalstate').on('change', function (e) {
    populateSchools(e.target.value);
  });

  const populateTeachers = (schoolId) => {
    let teacherSelect = $('#teacher');
    teacherSelect.find('option').remove();
    teacherSelect.trigger("chosen:updated");
    $.ajax({
      type: "GET",
      url: window.location.origin + "/users/teachersOfSchool",
      data: {
        schoolId: schoolId
      }
    }).done(users => {
      users.forEach(user => {
        teacherSelect.append(`<option value="${user._id}">${user.firstName} ${user.lastName}</option>`);
      });
      teacherSelect.trigger("chosen:updated");
    }).fail(function () {
      $.showNotification('Problem beim Auslesen der Lehrer', "danger", true);
    });
  };

  $('#school').on('change', function (e) {
    populateTeachers(e.target.value);
  });

  $('.invite-external-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const origin = window.location.origin;
    const teamId = $inviteExternalMemberModal.find(".modal-form .form-group").attr('data-teamId');

    if (!teamId) {
      $.showNotification('Bitte lade die Seite neu.', "danger", true);
      return false;
    }

    if (state.method === 'email') {
      inviteViaMail.call(this)
    } else if (state.method === 'directory') {
      inviteTeacher()
    }

    function inviteTeacher () {
      let userId = $('#teacher').val();
    
      $.ajax({
        type: "POST",
        url: origin + "/teams/external/invite",
        data: {
          teamId,
          userId
        }
      }).done(function () {
        $.showNotification('Lehrer erfolgreich zum Team eingeladen', "success", true);
        $inviteExternalMemberModal.modal('hide');
      }).fail(function () {
        $.showNotification('Problem beim Hinzufügen des Lehrers', "danger", true);
      });
    }

    function inviteViaMail () {
      const email = $(this).find(`div[data-role="${state.role}"] #email`).val();
      function validateEmail (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
      }
  
      if (!validateEmail(email)) {
        $.showNotification('Bitte gib eine gültige E-Mail an.', "danger", true);
        return false;
      }

      // collect some information for invite mail from UI, possibly not very stable at long-term TODO! Should be done on the server
      const infos = {
        userName: $(".navbar .account-toggle strong").html().split(" (")[0],
        teamName: $(".breadcrumb .breadcrumb-item:eq(1) a").html()
      };

      const userRole = state.role === 'teacher' ? 'teamadministrator'
                        : state.role === 'expert' ? 'teamexpert' : '';

      const data = {
        host: origin,
        role: userRole,
        teamId,
        invitee: email,
        infos: infos
      }

      $.ajax({
        type: "POST",
        url: origin + "/teams/invitelink",
        data
      }).done(result => {
        $inviteExternalMemberModal.modal('hide');
  
        if (result.inviteCallDone) {
          $.showNotification('Wenn die E-Mail in unserem System existiert, wurde eine Team-Einladungsmail versendet.', "info", true);        
        } else {
          $.showNotification('Möglicherweise gab es Probleme bei der Einladung. Bitte eingeladenen Nutzer oder Admins fragen.', "danger", true);
        } 
      }).fail(function () {
        $.showNotification('Problem beim Versenden der Einladung', "danger", true);
      });
      return false;      
    }
  });

  //    let userIds = $('#teacher').val();
  //    userIds = userIds.map(userId => {
  //      return { userId };
  //    });

  //    $.ajax({
  //      url: $(this).attr('action'),
  //      method: 'POST',
  //      data: {
  //        userIds
  //      }
  //    }).done(function() {
  //      $.showNotification('Teilnehmer erfolgreich zum Team hinzugefügt', "success", true);
  //      location.reload();
  //    }).fail(function() {
  //      $.showNotification('Problem beim Hinzufügen der Teilnehmer', "danger", true);
  //    });

  //    return false;
  //  });

  // $('.invite-external-member-modal form').on('submit', function (e) {
  //   e.stopPropagation();
  //   e.preventDefault();

  //   const email = $(this).find('#email').val();
  //   function validateEmail(email) {
  //     var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  //     return re.test(email);
  //   }
  //   if (!email || !validateEmail(email)) {
  //     $.showNotification('Bitte gib eine gültige E-Mail an.', "danger", true);
  //     return false;
  //   }

  //   const role = $(this).find('#role').val();
  //   if (!role) {
  //     $.showNotification('Bitte wähle eine Rolle aus.', "danger", true);
  //     return false;
  //   }

  //   const teamId = $inviteExternalMemberModal.find(".modal-form .form-group").attr('data-teamId');
  //   if (!teamId) {
  //     $.showNotification('Bitte lade die Seite neu.', "danger", true);
  //     return false;
  //   }
  //   const origin = window.location.origin;

  //   // collect some information for invite mail from UI, possibly not very stable at long-term
  //   const infos = {
  //     userName: $(".navbar .account-toggle strong").html().split(" (")[0],
  //     teamName: $(".breadcrumb .breadcrumb-item:eq(1) a").html()
  //   };

  //   $.ajax({
  //       type: "POST",
  //       url: origin + "/teams/invitelink",
  //       data: {
  //           host: origin,
  //           role: role,
  //           teamId: teamId,
  //           invitee: email,
  //           infos: infos
  //       }
  //   }).done(result => {
  //     $inviteExternalMemberModal.modal('hide');
  //     if (result.inviteCallDone) $.showNotification('Wenn die E-Mail in unserem System existiert, wurde eine Team-Einladungsmail versendet.', "info", true);
  //     else $.showNotification('Möglicherweise gab es Probleme bei der Einladung. Bitte eingeladenen Nutzer oder Admins fragen.', "danger", true);
  //   }).fail(function() {
  //     $.showNotification('Problem beim Versenden der Einladung', "danger", true);
  //   });
  //   return false;
  // });

  /////////////
  // Edit invitation
  /////////////
  $('.btn-edit-invitation').click(function (e) {
    e.stopPropagation();
    e.preventDefault();

    const $editInvitationModal = $('.edit-invitation-modal');
    const invitationId = $(this).parent().parent().find('[data-payload]').data('payload');

    populateModalForm($editInvitationModal, {
      title: 'Einladung bearbeiten',
      closeLabel: 'Abbrechen',
      submitLabel: 'Änderungen speichern',
      payload: invitationId
    });

    let $modalForm = $editInvitationModal.find(".modal-form");
    $editInvitationModal.appendTo('body').modal('show');
  });

  $('.btn-delete-invitation').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $deleteMemberModal = $('.delete-invitation-modal');
    state.currentInvitationEmail = $(this).parent().parent().find('[data-payload]').data('payload').email;
    
    populateModalForm($deleteMemberModal, {
      title: 'Einladung löschen',
      closeLabel: 'Abbrechen',
      submitLabel: 'Einladung löschen'
    });

    let $modalForm = $deleteMemberModal.find(".modal-form");
    $deleteMemberModal.appendTo('body').modal('show');
  });  

  $('.delete-invitation-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();

    $.ajax({
      url: $(this).attr('action'),
      method: 'DELETE',
      data: {
        email: state.currentInvitationEmail
      }
    }).done(function () {
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Löschen der Einladung', "danger", true);
    });

    return false;
  });  

  /////////////
  // Edit Member
  /////////////
  $('.btn-edit-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $editMemberModal = $('.edit-member-modal');
    const userId = $(this).parent().parent().find('[data-payload]').data('payload');
    populateModalForm($editMemberModal, {
      title: 'Teilnehmer bearbeiten',
      closeLabel: 'Abbrechen',
      submitLabel: 'Teilnehmer bearbeiten',
      payload: userId
    });

    let $modalForm = $editMemberModal.find(".modal-form");
    $editMemberModal.appendTo('body').modal('show');
  });

  $('.edit-member-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();

    if (!$(this).find('#role').val()) {
      $.showNotification('Bitte wähle eine Rolle aus.', "danger", true);
      return false;
    }

    const user = {
      userId: $(this).data('payload').userId,
      role: $(this).find('#role').val()
    };

    $.ajax({
      url: $(this).attr('action'),
      method: 'PATCH',
      data: {
        user
      }
    }).done(function () {
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Bearbeiten des Teilnehmers', "danger", true);
    });

    return false;
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
      title: 'Teilnehmer löschen',
      closeLabel: 'Abbrechen',
      submitLabel: 'Teilnehmer löschen',
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
    }).done(function () {
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Löschen des Teilnehmers', "danger", true);
    });

    return false;
  });

  /////////////
  // Delete Class
  /////////////
  $('.btn-delete-class').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $deleteClassModal = $('.delete-class-modal');
    const classIdToRemove = $(this).parent().parent().find('[data-payload]').data('payload');
    populateModalForm($deleteClassModal, {
      title: 'Klasse löschen',
      closeLabel: 'Abbrechen',
      submitLabel: 'Klasse löschen',
      payload: classIdToRemove
    });

    let $modalForm = $deleteClassModal.find(".modal-form");
    $deleteClassModal.appendTo('body').modal('show');
  });

  $('.delete-class-modal form').on('submit', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const classIdToRemove = $(this).data('payload').classId;

    $.ajax({
      url: $(this).attr('action'),
      method: 'DELETE',
      data: {
        classIdToRemove
      }
    }).done(function () {
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Löschen des Teilnehmers', "danger", true);
    });

    return false;
  });
});
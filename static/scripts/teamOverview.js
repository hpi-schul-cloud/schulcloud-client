$(document).ready(function () {

  $('.section-teamInvitations a').click(function (e) {
    e.stopPropagation();
    e.preventDefault();

    const id = $(this).parents('.sc-card-wrapper').data('id')

    $.ajax({
      url: '/teams/invitation/accept/' + id,
      method: 'GET'
    }).done(function () {
      $.showNotification('Einladung erfolgreich angenommen', "success", true);
      location.reload();
    }).fail(function () {
      $.showNotification('Problem beim Akzeptieren der Einladung', "danger", true);
    });    
  });
});
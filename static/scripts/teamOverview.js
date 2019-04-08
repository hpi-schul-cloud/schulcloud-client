$(document).ready(() => {
	$('.section-teamInvitations a').click(function handler(e) {
		e.stopPropagation();
		e.preventDefault();

		const id = $(this).parents('.sc-card-wrapper').data('id');

		$.ajax({
			url: `/teams/invitation/accept/${id}`,
			method: 'GET',
		}).done(() => {
			$.showNotification('Einladung erfolgreich angenommen', 'success', true);
			location.reload();
		}).fail(() => {
			$.showNotification('Problem beim Akzeptieren der Einladung', 'danger', true);
		});
	});

	$('.btn-member').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let teamId = $(this).attr('data-id');

        $.ajax({
            url: "/teams/" + teamId + "/usersJson"
        }).done(function (res) {
            let $memberModal = $('.member-modal');
            let teamMembers = 'Keine Teilnehmer';
            let teamName = res.course.name;
            if(res.course.userIds.length != 0) {
                teamMembers = '<ol>';
                res.course.userIds.forEach(member => {
                    if (member.displayName) {
                        teamMembers = teamMembers + '<li>' + member.displayName + '</li>';
                    } else {
                        teamMembers = teamMembers + '<li>' + member.firstName + ' ' + member.lastName + '</li>';
                    }
                });
                teamMembers = teamMembers + '</ol>';
            }

            populateModal($memberModal, '.modal-title', 'Mitglieder des Teams: '.concat(teamName));
            populateModal($memberModal, '#member-modal-body', teamMembers);

            $memberModal.appendTo('body').modal('show');
        });
    });
});

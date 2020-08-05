$(document).ready(() => {
	$('.btn-member').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let teamId = $(this).attr('data-id');

        $.ajax({
            url: "/teams/" + teamId + "/usersJson"
        }).done(function (res) {
            let $memberModal = $('.member-modal');
            let teamMembers = $t('global.text.noMembers');
            let teamName = res.course.name;
            if(res.course.userIds.length != 0) {
                teamMembers = '<ol>';
                res.course.userIds.forEach(member => {
                    const user = member.userId; // userId was populated
                    if (user.fullName) {
                        teamMembers = teamMembers + '<li>' + user.fullName + '</li>';
                    } else {
                        teamMembers = teamMembers + '<li>' + user.firstName + ' ' + user.lastName + '</li>';
                    }
                });
                teamMembers = teamMembers + '</ol>';
            }

            populateModal($memberModal, '.modal-title', $t('teams.headline.membersOfTeam', { teamName }));
            populateModal($memberModal, '#member-modal-body', teamMembers);

            $memberModal.appendTo('body').modal('show');
        });
    });
});

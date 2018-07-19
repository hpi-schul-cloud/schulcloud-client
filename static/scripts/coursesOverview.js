$(document).ready(function () {


    $('.btn-member').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let courseId = $(this).attr('data-id');

        $.ajax({
            url: "/courses/" + courseId + "/usersJson"
        }).done(function (res) {

            let $memberModal = $('.member-modal');
            let courseMembers = 'Keine Teilnehmer';
            let courseName = res.course.name;
            if(res.course.userIds.length != 0) {
                courseMembers = '<ol>';
                res.course.userIds.forEach(member => {
                    if (member.displayName) {
                        courseMembers = courseMembers + '<li>' + member.displayName + '</li>';
                    } else {
                        courseMembers = courseMembers + '<li>' + member.firstName + ' ' + member.lastName + '</li>';
                    }
                });
                courseMembers = courseMembers + '</ol>';
            }

            populateModal($memberModal, '.modal-title', 'Teilnehmer vom Kurs: '.concat(courseName));
            populateModal($memberModal, '#member-modal-body', courseMembers);
            populateModal($memberModal, '#course-edit', '<a href="/courses/'.concat(courseId).concat('/edit" class="btn btn-add btn-primary">Kurs bearbeiten</a>'));

            $memberModal.appendTo('body').modal('show');

        });
    });

});
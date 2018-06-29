$(document).ready(function () {


    $('.btn-member').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let courseId = $(this).attr('data-id');
        let courseName;
        let courseMembers = '<ol>';

        $.ajax({
            url: "/courses/" + courseId + "/json"
        }).done(function (res) {

            courseName = res.course.name;
            res.course.userIds.forEach(member => {
                if (member.displayName) {
                    courseMembers = courseMembers + '<li>' + member.displayName + '</li>';
                } else {
                    courseMembers = courseMembers + '<li>' + member.firstName + ' ' + member.lastName + '</li>';
                }
            });

            courseMembers = courseMembers + '</ol>';
            let $memberModal = $('.member-modal');

            populateModal($memberModal, '.modal-title', 'Teilnehmer vom Kurs: '.concat(courseName));
            populateModal($memberModal, '#member-modal-body', courseMembers);
            populateModal($memberModal, '#course-edit', '<a href="/courses/'.concat(courseId).concat('/edit" class="btn btn-add btn-primary">Kurs bearbeiten</a>'));

            $memberModal.modal('show');

        });
    });

});
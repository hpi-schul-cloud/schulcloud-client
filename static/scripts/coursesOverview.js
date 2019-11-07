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

            populateModal($memberModal, '.modal-title', 'Teilnehmer des Kurses: '.concat(courseName));
            populateModal($memberModal, '#member-modal-body', courseMembers);
            populateModal($memberModal, '#course-edit', '<a href="/courses/'.concat(courseId).concat('/edit" class="btn btn-add btn-primary">Kurs bearbeiten</a>'));

            $memberModal.appendTo('body').modal('show');

        });
    });

    $('.btn-import-course').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let $importModal = $('.import-modal');
        populateModalForm($importModal, {
            title: 'Kurs importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Abschicken'
        });

        let $modalForm = $importModal.find(".modal-form");
        $modalForm.attr('action', `/courses/import`);
        $importModal.appendTo('body').modal('show');
        $('.import-modal').trigger('hideButton');
    });

    $('.import-modal').bind('hideButton', () => {
        $('.btn-submit').hide();
        $('.btn-next-step').remove();

        $('#step1').show();
        $('#step2').hide();

        $('.modal-footer').append("<button type='button' class='btn btn-primary btn-next-step'>Nächster Schritt</button>");
    });

    $('.modal-footer').on('click', '.btn-next-step', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let shareToken = $('#shareToken').val();

        if (shareToken) {
            $('#step1').hide();

            $.get('/courses/share/' + shareToken, function (data, status) {
                if (status === 'success' && data.status === 'success') {
                    $('#courseName').val(data.msg);
                    $('#shareToken').attr('name', 'shareToken');
                } else {
                    $('.import-modal').modal('hide');
                    $.showNotification('Dieser shareToken scheint nicht in Verwendung zu sein!', 'danger', 10000);
                }
            });

            $('#step2').show();

            $('.btn-next-step').hide();
            $('.btn-submit').show();
        } else {
            $('<input type="submit">').hide().appendTo($('.import-modal').find(".modal-form")).click().remove();
        }
    })
    if($(".qr-import-text").get(0)){
        $('.btn-import-course')[0].click();
    }
});

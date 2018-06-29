$(document).ready(function () {


    $('.btn-member').on('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let courseId = $(this).attr('data-id');
        let courseName;
        let courseMembers = '<ol>';

        $.ajax({
            url: "/courses/"+courseId+"/json"
        }).done(function( res ) {

            console.log('Test');

            courseName = res.course.name;
            res.course.userIds.forEach(member => {
                if(member.displayName) {
                    courseMembers = courseMembers + '<li>' + member.displayName + '</li>';
                }else{
                    courseMembers = courseMembers + '<li>' + member.firstName+ ' ' + member.lastName + '</li>';
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

    $('.btn-hidden-toggle').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $hiddenToggleBtn = $(this);
        var $hiddenToggleIcon = $(this).find('.fa');
        $.ajax({
            method: 'PATCH',
            url: window.location.href + '/topics/' + $(this).attr('href') + '?json=true',
            data: {hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash')},
            success: function(result) {
                if (result.hidden) {
                    $hiddenToggleIcon.addClass('fa-eye-slash');
                    $hiddenToggleIcon.removeClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema sichtbar machen");
                } else {
                    $hiddenToggleIcon.removeClass('fa-eye-slash');
                    $hiddenToggleIcon.addClass('fa-eye');
                    $hiddenToggleBtn.attr('data-original-title', "Thema verstecken");
                }
            }
        });
    });

    $('.btn-create-invitation').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let target = $(this).attr("data-href") + 'addStudent';
        let $invitationModal = $('.invitation-modal');
        $.ajax({
            type: "POST",
            url: "/link/",
            data: {
                target: target
            },
            success: function(data) {
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: {invitation: data.newUrl}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='invitation']").click(function () {
                    $(this).select();
                });

                $invitationModal.modal('show');

            }
        });
    });


    $('.btn-import-topic').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        let courseId = $(this).attr("data-courseId");
        let $importModal = $('.import-modal');
        populateModalForm($importModal, {
            title: 'Thema importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Speichern',
            fields: {courseId: courseId}
        });

        let $modalForm = $importModal.find(".modal-form");
        $modalForm.attr('action', `/courses/${courseId}/importTopic`);
        $importModal.modal('show');
    });

    $(".move-handle").click(function(e) {
        e.stopPropagation();
    });

    $("#topic-list").sortable({
        placeholder: "ui-state-highlight",
        handle: '.move-handle',
        update: function(event, ui) {
            let positions = {};
            $( "#topic-list .card-topic" ).each(function(i) {
                positions[($( this ).attr("data-topicId"))] = i;
            });
            $.ajax({
                type: "PATCH",
                url: window.location.href + "/positions",
                data: positions
            });
        },
    });
    $( "#topic-list" ).disableSelection();
});

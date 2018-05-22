window.addEventListener("DOMContentLoaded", function(){
    /* FEATHERS FILTER MODULE */
    const filterModule = document.getElementById("filter");
    if(filterModule){
        filterModule.addEventListener('newFilter', (e) => {
            filter = e.detail;
            const newurl = "?filterQuery=" + escape(JSON.stringify(filter[0]));
            softNavigate(newurl, ".ajaxcontent", ".pagination");
        })
        document.querySelector(".filter").dispatchEvent(new CustomEvent("getFilter"));
    }
});

$(document).ready(function () {

    var $modals = $('.modal');
    var $addModal = $('.add-modal');
    var $editModal = $('.edit-modal');
    var $invitationModal = $('.invitation-modal');
    var $importModal = $('.import-modal');
    var $deleteModal = $('.delete-modal');
    var $pwModal = $('.pw-modal');

    $('.btn-add').on('click', function (e) {
        e.preventDefault();
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $addModal.modal('show');
    });

    $('.btn-edit').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
        $.getJSON(entry, function (result) {
            populateModalForm($editModal, {
                action: entry,
                title: 'Bearbeiten',
                closeLabel: 'Abbrechen',
                submitLabel: 'Speichern',
                fields: result
            });

            // post-fill gradiation selection
            if ($editModal.find("input[name=gradeSystem]").length) {
                var $gradeInputPoints = $editModal.find("#gradeSystem0");
                var $gradeInputMarks = $editModal.find("#gradeSystem1");
                if(result.gradeSystem) {
                    $gradeInputMarks.attr("checked", true);
                    $gradeInputPoints.removeAttr("checked");
                } else {
                    $gradeInputPoints.attr("checked", true);
                    $gradeInputMarks.removeAttr("checked");
                }
            }
            populateCourseTimes($editModal, result.times || []);
            $editModal.modal('show');
        });
    });

    $('.btn-invitation-link').on('click', function (e) {
        e.preventDefault();
        let target = 'register/' + $invitationModal.find("input[name='schoolId']").attr("value");
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

    $('.btn-import').on('click', function (e) {
        e.preventDefault();
        populateModalForm($importModal, {
            title: 'CSV Importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Importieren'
        });
        $importModal.modal('show');
    });

    $('.sso-type-selection').on('change', function (e) {
        e.preventDefault();
        // show oauth properties for iserv only (todo: later we need a extra field, if we have some more oauth providers)
        let selectedType = $(this).find("option:selected").val();
        selectedType === 'iserv'
            ? $('.collapsePanel').css('display', 'block')
            : $('.collapsePanel').css('display', 'none');
    });

    $(".edit-modal").on('shown.bs.modal', function() {
        // when edit modal is opened, show oauth properties for iserv
        let selectedType = $(this).find('.sso-type-selection').find("option:selected").val();
        selectedType === 'iserv' ? $(this).find('.collapsePanel').css('display', 'block') : '';
    });

    $modals.find('.close, .btn-close').on('click', function () {
        $modals.modal('hide');
    });

    $('.btn-delete').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).parent().attr('action');
        $.getJSON(entry, function (result) {
            populateModalForm($deleteModal, {
                action: entry,
                title: 'Löschen',
                closeLabel: 'Abbrechen',
                submitLabel: 'Löschen',
                fields: result
            });

            $deleteModal.modal('show');
        });
    });

    $('.btn-pw').on('click', function (e) {
        e.preventDefault();
        var entry = $(this).attr('href');
            populateModalForm($pwModal, {
                action: entry,
                title: 'Passwort ändern',
                closeLabel: 'Abbrechen',
                submitLabel: 'Speichern',
                fields: undefined
            });

            $pwModal.modal('show');
    });

});
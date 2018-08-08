import { softNavigate } from './helpers/navigation';
import { populateCourseTimes } from './coursesTimes';

window.addEventListener("DOMContentLoaded", function(){
    /* FEATHERS FILTER MODULE */
    const filterModule = document.getElementById("filter");
    if(filterModule){
        filterModule.addEventListener('newFilter', (e) => {
            const filter = e.detail;
            const newurl = "?filterQuery=" + escape(JSON.stringify(filter[0]));
            softNavigate(newurl, ".ajaxcontent", ".pagination");
        });
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

    $('.btn-add-modal').on('click', function (e) {
        e.preventDefault();
        populateModalForm($addModal, {
            title: 'Hinzufügen',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $addModal.appendTo('body').modal('show');
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

                $invitationModal.appendTo('body').modal('show');

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
        $importModal.appendTo('body').modal('show');
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

            $deleteModal.appendTo('body').modal('show');
        });
    });
});

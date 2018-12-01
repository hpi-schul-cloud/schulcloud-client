import { softNavigate } from './helpers/navigation';
import { populateCourseTimes } from './coursesTimes';
import './jquery/datetimepicker-easy';

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

    $('.btn-edit').on('click', function (e) {	
        e.preventDefault();	
        var entry = $(this).attr('href');	
        $.getJSON(entry, function (result) {
            result.createdAt = new Date(result.createdAt).toLocaleString();
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
            $editModal.appendTo('body').modal('show');	
        });	
    });

    $('.btn-invitation-link').on('click', function (e) {
        e.preventDefault();
        let schoolId = $invitationModal.find("input[name='schoolId']").val(),
            role = "student";
        if ($(this).hasClass("teacher")) role = "teacher";
        $.ajax({
            type: "POST",
            url: window.location.origin+"/administration/registrationlink",
            data: {
                role: role,
                save: true,
                schoolId: schoolId,
                host: window.location.origin
            },
            success: function(linkData) {
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: {invitation: linkData.shortLink}
                });
                $invitationModal.find('.btn-submit').remove();
                $invitationModal.find("input[name='invitation']").click(function () {
                    $(this).select();
                });

                $invitationModal.appendTo('body').modal('show');

            }
        });
    });

    $('.btn-send-links-emails').on('click', function (e) {
        e.preventDefault();
        const $this = $(this);
        
        const text  = $this.html();
        $this.html('E-Mails werden gesendet...');
        $this.attr("disabled", "disabled");

        let schoolId = $invitationModal.find("input[name='schoolId']").val();

        $.ajax({
            type: "GET",
            url: window.location.origin+"/administration/students-without-consent/send-email",
            data: {
                schoolId,
            }
        }).done(function(data) {
            $.showNotification('Erinnerungs-Emails erfolgreich versendet', "success", true);
            $this.attr("disabled", false);
            $this.html(text);
        }).fail(function (data) {
            $.showNotification('Fehler beim senden der Erinnerungs-Emails', "danger", true);
            $this.attr("disabled", false);
            $this.html(text);
        });
    });

    $('.btn-print-links').on('click', function (e) {
        e.preventDefault();
        const $this = $(this);
        
        const text  = $this.html();
        $this.html('Druckbogen wird generiert...');
        $this.attr("disabled", "disabled");

        let schoolId = $invitationModal.find("input[name='schoolId']").val();

        $.ajax({
            type: "GET",
            url: window.location.origin+"/administration/students-without-consent/get-json",
            data: {
                schoolId
            }
        }).done(function(data) {
            $.showNotification('Druckbogen erfolgreich generiert', "success", true);
            $this.attr("disabled", false);
            $this.html(text);
        }).fail(function (data) {
            $.showNotification('Problem beim Erstellen des Druckbogens', "danger", true);
            $this.attr("disabled", false);
            $this.html(text);
        });
    });

    $('.btn-import').on('click', function (e) {
        e.preventDefault();
        populateModalForm($importModal, {
            title: 'CSV Importieren',
            closeLabel: 'Abbrechen',
            submitLabel: 'Importieren',
            fields: {
                sendRegistration: 'true'
            }
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

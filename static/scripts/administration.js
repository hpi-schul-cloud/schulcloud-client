import { softNavigate } from './helpers/navigation';
import { populateCourseTimes } from './coursesTimes';
import './jquery/datetimepicker-easy';
import { updateQueryStringParameter, getQueryParameterByName } from './helpers/queryStringParameter';

window.addEventListener("DOMContentLoaded", function () {
    /* FEATHERS FILTER MODULE */
    const filterModule = document.getElementById("filter");
    if (filterModule) {
        filterModule.addEventListener('newFilter', (e) => {
            const filter = e.detail;
            const newurl = "?filterQuery=" + escape(JSON.stringify(filter[0])) + '&p=' + getQueryParameterByName('p');
            softNavigate(newurl, ".ajaxcontent", ".pagination");
        });
        document.querySelector(".filter").dispatchEvent(new CustomEvent("getFilter"));
    }
});

function printInvitations(users) {
    event.preventDefault();
    let w = window.open();
    w.document.write(`<style>
    @page {size: A4; margin: 16px;}
    .part{ border: 1px solid #999; width: 110px; float: left; padding: 8px; margin: 4px;}
    img{width: 100% !important; height: auto !important;}
    p{font-size: 10px; color: #555; min-height: 26px; margin: 8px 0 0; text-align: center; word-break: break-all;}
    </style>`);
    for (let user of users) {
        const image = kjua({ text: user.registrationLink.shortLink, render: 'image' });
        w.document.write(`<div class="part">
                            <div class="image-wrapper" id="user-${user._id}"></div>
                            <h4 style="margin-bottom: 10px">${user.displayName}</h4>
                            <p>${user.registrationLink.shortLink}</p>
                        </div>`);
        w.document.querySelector('#user-' + user._id).appendChild(image.cloneNode(true));
    }

    w.document.close();
    /* eventListener is needed to give the browser some rendering time for the image */
    w.addEventListener('load', () => {
        w.focus();
        w.print();
        w.close();
    });
}
window.addEventListener("softNavigate", (event) => {
    let target_url = event.detail.target_url;
    var param = getQueryParameterByName('p', target_url);
    updateQueryStringParameter('p', param);
});

let handlerRegistered = false;

$(document).ready(function () {
    var $modals = $('.modal');
	var $terminateSchoolYearModal = $('.terminate-school-year-modal');
	var $startSchoolYearModal = $('.start-school-year-modal');
    var $addSystemsModal = $('.add-modal');
    var $addRSSModal = $('.add-modal--rss');
    var $editModal = $('.edit-modal');
    var $invitationModal = $('.invitation-modal');
    var $importModal = $('.import-modal');
    var $deleteSystemsModal = $('.delete-modal');
	var $deleteRSSModal = $('.delete-modal--rss');
	
	$('.ldapschoolyearadditionalinfotoggle').on('click', function (e) {
        e.preventDefault();
        $('#ldapschoolyearadditionalinfo').toggle();
	});

    $('.btn-terminate-school-year').on('click', function (e) {
        e.preventDefault();
        populateModalForm($terminateSchoolYearModal, {
            title: 'Das Schuljahr wirklich beenden?',
            closeLabel: 'Abbrechen',
            submitLabel: 'Ja'
        });
        $terminateSchoolYearModal.appendTo('body').modal('show');
	});
	
	$('.btn-start-school-year').on('click', function (e) {
        e.preventDefault();
        populateModalForm($startSchoolYearModal, {
            title: 'Das neue Schuljahr einläuten?',
            closeLabel: 'Abbrechen',
            submitLabel: 'Ja'
        });
        $startSchoolYearModal.appendTo('body').modal('show');
	});

	$('#checkldapdata').on('click', function (e) {
		e.preventDefault();
		document.querySelector('#startldapschoolyear').disabled = false;
        window.open("/administration/startldapschoolyear"); 
	});
	
	document.querySelector('#startldapschoolyear').addEventListener('change', (status) => {
		if (status.currentTarget.checked) {
			document.querySelector('#buttonstartldapschoolyear').disabled = false;
			document.querySelector('#checkldapdata').classList.add('disabled');
			document.querySelector('#section-2').classList.remove('current');
			document.querySelector('#section-2').classList.add('done');
			document.querySelector('#section-2').innerHTML = '&#x2713;';
			document.querySelector('#section-3').classList.add('current');
		} else {
			document.querySelector('#buttonstartldapschoolyear').disabled = true;
			document.querySelector('#checkldapdata').classList.remove('disabled');
			document.querySelector('#section-2').classList.remove('done');
			document.querySelector('#section-2').classList.add('current');
			document.querySelector('#section-2').innerHTML = '2';
			document.querySelector('#section-3').classList.remove('current');
		}
	});

    $('.btn-add-modal').on('click', function (e) {
        e.preventDefault();
        populateModalForm($addSystemsModal, {
            title: 'Hinzufügen',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $addSystemsModal.appendTo('body').modal('show');
    });

    $('.btn-add-modal--rss').on('click', function (e) {
        e.preventDefault();
        populateModalForm($addRSSModal, {
            title: 'Hinzufügen',
            closeLabel: 'Abbrechen',
            submitLabel: 'Hinzufügen'
        });
        $addRSSModal.appendTo('body').modal('show');
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
                if (result.gradeSystem) {
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
            url: window.location.origin + "/administration/registrationlink",
            data: {
                role,
                save: true,
                schoolId: schoolId,
                host: window.location.origin
            },
            success: function (linkData) {
                populateModalForm($invitationModal, {
                    title: 'Einladungslink generiert!',
                    closeLabel: 'Abbrechen',
                    submitLabel: 'Speichern',
                    fields: { invitation: linkData.shortLink }
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
            title: 'Nutzer Importieren',
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

    $(".edit-modal").on('shown.bs.modal', function () {
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
            populateModalForm($deleteSystemsModal, {
                action: entry,
                title: 'Löschen',
                closeLabel: 'Abbrechen',
                submitLabel: 'Löschen',
                fields: result
            });

            $deleteSystemsModal.appendTo('body').modal('show');
        });
    });

    $('.btn-delete--rss').on('click', function (e) {
        e.preventDefault();
        const action = $(this).parent().attr('action');
        const url = $(this).parent().attr('data-url');
        $.getJSON(action, function (result) {
            populateModalForm($deleteRSSModal, {
                action,
                fields: { url: result.url },
                title: 'Löschen',
                closeLabel: 'Abbrechen',
                submitLabel: 'Löschen',
            });

            $deleteRSSModal.modal('show');
        });
    });

    if (!handlerRegistered) {
        // softNavigate triggers documentReady again duplicating click handlers
        handlerRegistered = true;

        $('.btn-send-links-emails').on('click', function (e) {
            e.preventDefault();
            const $this = $(this);
            const text = $this.html();
            const role = $this.data('role');

            $this.html('E-Mails werden gesendet...');
            $this.attr("disabled", "disabled");

            $.ajax({
                type: "GET",
                url: window.location.origin + "/administration/users-without-consent/send-email",
                data: {
                    role
                }
            }).done(function (data) {
                $.showNotification('Erinnerungs-E-Mails erfolgreich versendet', "success", true);
                $this.attr("disabled", false);
                $this.html(text);
            }).fail(function (data) {
                $.showNotification('Fehler beim senden der Erinnerungs-E-Mails', "danger", true);
                $this.attr("disabled", false);
                $this.html(text);
            });
        });

        $('.btn-print-links').on('click', function (e) {
            e.preventDefault();
            const $this = $(this);
            const text = $this.html();
            const role = $this.data('role');

            $this.html('Druckbogen wird generiert...');
            $this.attr("disabled", "disabled");

            $.ajax({
                type: "GET",
                url: window.location.origin + "/administration/users-without-consent/get-json",
                data: {
                    role
                }
            }).done(function (users) {
                printInvitations(users);
                $.showNotification('Druckbogen erfolgreich generiert', "success", true);
                $this.attr("disabled", false);
                $this.html(text);
            }).fail(function (data) {
                $.showNotification('Problem beim Erstellen des Druckbogens', "danger", true);
                $this.attr("disabled", false);
                $this.html(text);
            });
        });

        $('#csv-import-example').on('click', (e) => {
            e.preventDefault();
            const lines = [
                'firstName,lastName,email,class',
                'Max,Mustermann,max@mustermann.de,',
                'Fritz,Schmidt,fritz.schmidt@schul-cloud.org,1a',
                'Paula,Meyer,paula.meyer@schul-cloud.org,12/2+12/3',
            ];
            const csvContent = 'data:text/csv;charset=utf-8,' + lines.join("\n");
            const link = document.createElement('a');
            link.setAttribute('href', encodeURI(csvContent));
            link.setAttribute('download', 'beispiel.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

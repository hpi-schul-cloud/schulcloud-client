$(document).ready(function () {
  $('.btn-add-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $addMemberModal = $('.add-member-modal');
    populateModalForm($addMemberModal, {
        title: 'Mitglieder hinzufügen',
        closeLabel: 'Abbrechen',
        submitLabel: 'Mitglieder hinzufügen'
    });

    let $modalForm = $addMemberModal.find(".modal-form");
    $addMemberModal.appendTo('body').modal('show');
  });

  $('.btn-delete-member').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    let $deleteMemberModal = $('.delete-member-modal');
    populateModalForm($deleteMemberModal, {
        title: 'Mitglieder hinzufügen',
        closeLabel: 'Abbrechen',
        submitLabel: 'Mitglieder hinzufügen'
    });

    let $modalForm = $deleteMemberModal.find(".modal-form");
    $deleteMemberModal.appendTo('body').modal('show');
  });
});
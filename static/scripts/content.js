import { softNavigate } from './helpers/navigation';
import { updateQueryStringParameter } from './helpers/queryStringParameter';


function loadSearchResult(event){
	event.preventDefault();
	const newUrl = updateQueryStringParameter("q",document.querySelector(".search-field").value, true);
	softNavigate(newUrl, ".ajaxcontent", ".pagination");
}

window.addEventListener("DOMContentLoaded", function(){
    /* FEATHERS FILTER MODULE */
    const filterModule = document.getElementById("filter");
    if(filterModule){
        filterModule.addEventListener('newFilter', (e) => {
            const filter = e.detail;
			const newurl = `?q=${document.querySelector('.search-field').value}&filterQuery=${escape(JSON.stringify(filter[0]))}`;
            softNavigate(newurl, ".ajaxcontent", ".pagination");
        });
        document.querySelector(".filter").dispatchEvent(new CustomEvent("getFilter"));
	}

	/* SOFT NAVIGATE SEARCH */
	const searchField = document.querySelector(".search-field");
	if(document.querySelector('#filter') && searchField){
		searchField.closest("form").addEventListener("submit", loadSearchResult);
	}
});

$(document).ready(function () {
	var $modals = $('.modal');
	var $editModal = $('.edit-modal');
	var $externalLinkModal = $('.external-link-modal');

	var populateCourseSelection = function (modal, courses) {
		var $selection = modal.find('.course-selection');
		courses.forEach(function (course) {
			var option = document.createElement("option");
			option.text = course.name;
			option.value = course._id;
			$selection.append(option);
		});
		$selection.chosen().trigger("chosen:updated");
	};

	var populateLessonSelection = function (modal, lessons) {
		var $selection = modal.find('.lesson-selection');
		$selection
			.find('option')
			.remove()
			.end();

		lessons.forEach(function (lesson) {
			var option = document.createElement("option");
			option.text = lesson.name;
			option.value = lesson._id;
			$selection.append(option);
		});

		modal.find('.lessons').css("display", "block");
		$selection.chosen().trigger("chosen:updated");
	};

	$('.add-to-lesson').on('click', function (e) {
		e.preventDefault();
		var entry = $(this).attr('href');
		var query = $('.search-field');

		$.getJSON(entry, function (result) {
			var fields = result.content;
			fields.query = query.val();

			if(window.isInline) {
					window.opener.addResource({
						url: fields.url,
						title: fields.title,
						description: fields.description,
						client: fields.providerName
					});
					window.close();
					return;
			}

			populateModalForm($editModal, {
				title: $t('content.headline.addContentToTopic'),
				closeLabel: $t('global.button.cancel'),
				submitLabel: $t('global.button.send'),
				fields: fields
			});
			populateCourseSelection($editModal, result.courses);
			$editModal.appendTo('body').modal('show');
		});

	});

	$('.course-selection').on('change', function () {
		var selectedCourse = $(this).find("option:selected").val();
		$.getJSON('/courses/' + selectedCourse + '/json', function (res) {
			populateLessonSelection($editModal, res.lessons.data);
		});
	});

	$('.external-link').on('click', function () {
		populateModalForm($externalLinkModal, {
				title: $t('content.headline.youAreLeavingSC'),
				closeLabel: $t('global.button.cancel')
		});
		$externalLinkModal.find('.external-link-btn').attr('href', $(this).data('external-link'));
		var provider = $externalLinkModal.find('.provider');
		provider.html($(this).data('provider') || provider.html());
		$externalLinkModal.appendTo('body').modal('show');
	});

	$modals.find('.close, .btn-close, .external-link-btn').on('click', function () {
		$modals.modal('hide');
	});
});

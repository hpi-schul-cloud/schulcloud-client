import Vue from 'vue';

// import { MdButton, MdContent, MdTabs, MdSteppers, MdStep } from 'vue-material/dist/components'
import VueMaterial from 'vue-material';
import VueConfig from 'vue-config';
import VueResource from 'vue-resource';

import 'vue-material/dist/vue-material.min.css';

const configFile = require('./config');

const configs = configFile.configs;
Vue.use(VueConfig, configs);


Vue.use(VueMaterial);
Vue.use(VueResource);

Vue.config.devtools = true;


import App from './App.vue';

var vm = new Vue({
	el: '#app',
	template: '<App/>',
	components: { App }
})


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
				title: 'Material zu Thema hinzufügen',
				closeLabel: 'Abbrechen',
				submitLabel: 'Senden',
				fields: fields
			});
			populateCourseSelection($editModal, result.courses.data);
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
				title: 'Sie verlassen jetzt die Schul-Cloud',
				closeLabel: 'Abbrechen',
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

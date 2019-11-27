import livesearch from './helpers/livesearch';
import { resizeIframes } from './helpers/iFrameResize';
import './help/contactForm';

const fileMaxSize = 10 * 1024 * 1024; // 10 MB

$(document).ready(() => {
	$('.btn-poll').on('click', (e) => {
		e.preventDefault();

		document.cookie = 'pollClicked=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
	});

	if (!$('textarea[name= problemDescription]').val()) {
		/* eslint-disable max-len */
		$('textarea[name= problemDescription]').text(`Ich als [Nutzerrolle] 
habe auf der Seite [???]
die Funktion [???]
aufgrund des Fehlers/der Fehlermeldung "[???]"
nicht benutzen können.

Mit welchen Elementen tritt das Problem auf?
Tritt der Fehler bei weiteren Elementen desselben Bereichs (z.B. andere Kurse oder Nutzer) auf?
Wenn mehrere Schritte notwendig sind, um das Problem nachzuvollziehen, diese hier bitte so kurz und klar wie möglich beschreiben.
`);
	}

	$('.form-control-file').change(function x() {
		let fileSize = 0;
		if (this.files.length > 0) {
			for (let i = 0; i <= this.files.length - 1; i += 1) {
				if (this.files.item(i).type.includes('image/') || this.files.item(i).type.includes('video/')) {
					document.getElementById('file-alert').innerHTML = '';
				} else {
					document.getElementById('file-alert')
						.innerHTML = `"${this.files.item(i).name}" ist kein Bild oder Video!`;
					return;
				}
				fileSize += this.files.item(i).size;
			}
		}
		if (fileSize > fileMaxSize) {
			if (this.files.length > 1) {
				document.getElementById('file-alert')
					.innerHTML = 'Die angehängten Dateien überschreitet die maximal zulässige Gesamtgröße!';
			} else {
				document.getElementById('file-alert')
					.innerHTML = 'Die angehängte Datei überschreitet die maximal zulässige Größe!';
			}
			// TODO: disable button for sending
		} else {
			document.getElementById('file-alert').innerHTML = '';
		}
	});
});

// iFrame full height
resizeIframes(undefined, () => {
	document.querySelectorAll('.mobile-warning').forEach((warning) => {
		warning.remove();
	});
	document.querySelectorAll('iframe').forEach((frame) => {
		frame.setAttribute('scrolling', 'no');
	});
});


/* script for iFrame
// this needs to be embedded on every page that should be displayed via iFrame
// and the message to the parent should be send, whenever the page resizes.
// This script shouldn't be removed from here unless it's saved somewhere save where we can find it when needed.

window.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if(message.function){
        if(message.function === "getSize" && message.identifier){
            window.parent.postMessage(JSON.stringify({
                identifier: message.identifier,
                size: {
                    x: document.body.scrollWidth,
                    y: document.body.scrollHeight
                }
            }), '*');
        }
    }
}, false);
*/

// confluence live-search
function truncate(text, length) {
	if (text.length <= length) {
		return text;
	}
	const subString = text.substr(0, length - 1);
	return `${subString.substr(0, subString.lastIndexOf(' '))}...`;
}

function extractResults(result) {
	return result.results;
}

function parseData(result) {
	if (result) {
		return {
			class: '',
			link: `/help/confluence/${result.id}`,
			title: result.title,
			short_description: truncate(result.bodyTextHighlights, 100),
		};
	}
	return {
		class: 'disabled',
		link: '#',
		title: 'Keine Ergebnisse gefunden 😪',
		short_description: 'Probiere es mit anderen Suchbegriffen erneut',
	};
}
const config = {
	// eslint-disable-next-line
	url: 'https://docs.schul-cloud.org/rest/searchv3/1.0/search?queryString=${inputValue}&where=SCDOK&type=page&pageSize=10&highlight=false',
	extractResultArray: extractResults,
	dataParser: parseData,
	livesearchRootSelector: '.live-search',
	inputSelector: 'input.search',
	resultContainerSelector: '.live-search-results',
};
livesearch(config);

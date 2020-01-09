/* LAZYIMAGE
	Usage:
		1. add class "lazyImage" to img tag
		2. replace src with data-src
		3. optional: add data-attributes: "width", "height", "quality", "gravity" (also see: https://github.com/pichasso/pichasso)
		4. include this script:
			<script src="/scripts/helpers/lazyImage.js" type="text/javascript" data-PICHASSO_URL="{{@root.PICHASSO_URL}} defer></script>
		DONE

	Example:
		<img class="card-img-top circular lazyImage" data-src="/example/image.png" data-width="150" data-height="150">
*/

window.addEventListener('load', () => {
	const PICHASSO_URL = document.querySelector('script[data-PICHASSO_URL]').dataset.pichasso_url;
	const { protocol, host } = window.location;
	const lazyImages = document.querySelectorAll('img.lazyImage');

	const buildOptionalQueryString = ((dataset) => {
		let qs = '';
		if (dataset.width) {
			qs += `&width=${dataset.width}`;
		}
		if (dataset.height) {
			qs += `&height=${dataset.height}`;
		}
		if (dataset.quality
			&& dataset.quality <= 100
			&& dataset.quality >= 1) {
			qs += `&quality=${dataset.quality}`;
		}
		if (dataset.gravity
			&& (dataset.gravity === 'faces' || dataset.gravity === 'center')) {
			qs += `&gravity=${dataset.gravity}`;
		}
		return qs;
	});

	const buildUrl = ((dataset) => {
		const fileUrl = encodeURIComponent(`${protocol}//${host}${dataset.src}`);
		const oqs = buildOptionalQueryString(dataset);
		return `${PICHASSO_URL}/image?file=${fileUrl}${oqs}`;
	});

	Array.from(lazyImages).forEach((lazyImage) => {
		const ds = lazyImage.dataset;
		// check src is defined
		if (ds.src) {
			// IF PICHASSO_URL is defined THEN use pichasso
			if (PICHASSO_URL) {
				lazyImage.src = buildUrl(ds);
			} else {
				lazyImage.src = ds.src;
			}
		}
	});
});

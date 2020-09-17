/* global kjua */
export default function printQRs(items) {
	const w = window.open();
	w.document.write(`<style>
	@page {size: A4; margin: 16px;}
	.part{ border: 1px solid #999; width: 110px; float: left; padding: 8px; margin: 8px;}
	img{width: 100% !important; height: auto !important;}
	.title{font-size: 14px;margin: 0 0 10px 0;overflow: hidden;text-overflow: ellipsis;height: 32px;padding:0;}
	.description{
		font-size: 10px; color: #555; height: 85px; margin: 8px 0 0; text-align: center; word-break: break-all;
	}
	</style>`);
	if (items.length === 0) {
		w.document.write($t('administration.text.noEntriesToPrint'));
	} else {
		items.forEach((item, index) => {
			const image = kjua({ text: item.href, render: 'image' });
			w.document.write(`<div class="part">
			<div class="image-wrapper" id="item-${index}"></div>
			${item.title ? `<h4 class="title">${item.title}</h4>` : ''}
			${item.description ? `<p class="description">${item.description}</p>` : ''}
			</div>`);
			w.document
				.querySelector(`#item-${index}`)
				.appendChild(image.cloneNode(true));
		});
	}

	w.document.close();
	/* eventListener is needed to give the browser some rendering time for the image */
	w.addEventListener('load', () => {
		w.focus();
		w.print();
		setTimeout(function () { w.close(); }, 500);
	});
}

// Formulas are stored as `<span class="math-tex">` with TeX delimiters, because the
// read-only views render them with KaTeX auto-render, which scans text for delimiters.
export function extractDelimiters(rawEquation) {
	const trimmed = rawEquation.trim();
	const hasInlineDelimiters = trimmed.includes('\\(') && trimmed.includes('\\)');
	const hasDisplayDelimiters = trimmed.includes('\\[') && trimmed.includes('\\]');

	if (hasInlineDelimiters || hasDisplayDelimiters) {
		return {
			equation: trimmed.substring(2, trimmed.length - 2).trim(),
			display: hasDisplayDelimiters,
		};
	}

	return { equation: trimmed, display: false };
}

export function addDelimiters(equation, display) {
	return display ? `\\[${equation}\\]` : `\\(${equation}\\)`;
}

export function isMathWidget(element) {
	return !!element
		&& (element.is('element', 'mathtex-inline') || element.is('element', 'mathtex-display'));
}

export function getSelectedMathWidget(selection) {
	const selectedElement = selection.getSelectedElement();

	return isMathWidget(selectedElement) ? selectedElement : null;
}

export function renderEquation(equation, element, display = false) {
	const { katex } = window;

	// KaTeX is loaded globally with `defer`; show the raw source rather than nothing.
	if (!katex) {
		element.textContent = addDelimiters(equation, display);
		return;
	}

	katex.render(equation, element, { throwOnError: false, displayMode: display });
}

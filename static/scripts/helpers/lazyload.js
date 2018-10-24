/* LAZYLOAD

Usage: 
    1. insert the HTML you wan't to lazyload inside a noscript-Tag with the class ".lazyload" 
    2. and include this script 
    DONE

<noscript class="lazyload">
    <p>cool lazyloaded image:</p><img src="./example/image.png" />
</noscript>
*/

window.addEventListener('load', () => {
    const lazyloads = document.querySelectorAll('noscript.lazyload');
    // This container is the HTML parser
    const container = document.createElement('div');
    Array.from(lazyloads).forEach(lazyload => {
        const parent = lazyload.parentNode;
        container.innerHTML = lazyload.textContent;
        Array.from(container.children).forEach(n =>
            parent.insertBefore(n, lazyload)    // insert content into DOM -> start loading
        );
        lazyload.remove(); // remove original to prevent double execution
    });
});
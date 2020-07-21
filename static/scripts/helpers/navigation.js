/* global jQuery */

export function softNavigate(newurl, selector = 'html', listener, callback) {
    $.ajax({
        type: "GET",
        url: newurl
    }).done(function (r) {
        // render new page
        const parser = new DOMParser();
        const newPage = parser.parseFromString(r, "text/html");
        // apply new page
        try {
            const newPagePart = newPage.querySelector(selector);
            const oldPagePart = document.querySelector(selector);
            oldPagePart.innerHTML = newPagePart.innerHTML;
            document.querySelectorAll((listener || selector) + " a").forEach(link => {
                const linkClone = link.cloneNode(true);
                linkClone.addEventListener("click", function (e) {
                    const navigateEvent = new CustomEvent("softNavigate", {
                        detail: {
                            target_url: $(this).attr('href')
                        }
                    });
                    window.dispatchEvent(navigateEvent);
                    softNavigate($(this).attr('href'), selector, listener);
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                link.parentNode.replaceChild(linkClone, link);
            });
            // scroll to top
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
            jQuery(document).trigger('pageload');
            if (callback) {
                callback();
            }
        } catch (e) {
            console.error(e);
            $.showNotification($t('navigation.text.errorNavigation'), 'danger', true);
        }
    });
}

/* eslint-disable no-console */
/* apply input from query */
import { getQueryParameters } from './queryStringParameter';

window.addEventListener('DOMContentLoaded', ()=>{
    const params = getQueryParameters();
    for(let key in params){
        const value = params[key];
        try{
            document.querySelectorAll(`input[name="${key}"]`).forEach((input) => {
                input.value = value;
                input.setAttribute("readonly","true");
                var event = new Event('input', {
                    'bubbles': true,
                    'cancelable': true
                });
                input.dispatchEvent(event);
            });
        }catch(error){
            console.error(`Element: 'input[name="${key}"]' not found`);
        }
    }
});
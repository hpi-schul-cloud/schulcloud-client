import 'jquery-datetimepicker';


if(!window.datetimepicker){
    window.datetimepicker = (event)=>{
        /* DATE(-TIME) PICKER */
        function triggerInputEvent(currentDateTime){
            var event = new Event('input', {
                'bubbles': true,
                'cancelable': true
            });
            this[0].ownerDocument.activeElement.dispatchEvent(event);
        }

        function readPickerConfig(input){
            return {
                format:     (input.dataset.datetime?'d.m.Y H:i':'d.m.Y'),
                mask:       (input.dataset.datetime?'39.19.9999 29:59':'39.19.9999'),
                timepicker: (input.dataset.datetime  || false),
                startDate:  (input.dataset.startDate || false),
                minDate:    (input.dataset.minDate || 'yesterday'), //yesterday is minimum date(for today use 0 or -1970/01/01)
                maxDate:    (input.dataset.maxDate || 'tomorrow'),  //tomorrow is maximum date calendar
                inline:     (input.dataset.inline=="true"),
                onChangeDateTime: triggerInputEvent
            };
        }

        // https://xdsoft.net/jqplugins/datetimepicker/
        $.datetimepicker.setLocale('de');
        document.querySelectorAll('input[data-date], input[data-datetime]').forEach((input)=>{
            $(input).datetimepicker(readPickerConfig(input));
            input.setAttribute("autocomplete","off");
            // modified regex from: https://www.regextester.com/97612
            let pattern =`(3[01]|[12][0-9]|0?[1-9])\\.(1[012]|0?[1-9])\\.((?:19|20)[0-9]{2})`;
            if(input.dataset.datetime){ pattern += `[[:space:]][0-2][0-3]:[0-5][0-9]`; }
            input.setAttribute("pattern", pattern);
        });
    }
    window.addEventListener('load', window.datetimepicker);
}
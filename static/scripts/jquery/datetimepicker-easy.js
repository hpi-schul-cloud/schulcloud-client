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
                format:     (input.dataset.datetime !== undefined ?'d.m.Y H:i':'d.m.Y'),
                mask:       (input.dataset.datetime !== undefined ?'39.19.9999 29:59':'39.19.9999'),
                timepicker: (input.dataset.datetime !==  undefined  || false),
                startDate:  (input.dataset.startDate),
                minDate:    (input.dataset.minDate), //default: unlimited minimum date
                maxDate:    (input.dataset.maxDate), //default: unlimited maximum date
                inline:     (input.dataset.inline=="true"),
                onChangeDateTime: triggerInputEvent
            };
        }

        // https://xdsoft.net/jqplugins/datetimepicker/
        $.datetimepicker.setLocale('de');
        document.querySelectorAll('input[data-date], input[data-datetime]').forEach((input)=>{
            $(input).datetimepicker(readPickerConfig(input));
            input.setAttribute("autocomplete","off");
        });
    }
    document.addEventListener('DOMContentLoaded', window.datetimepicker);
}

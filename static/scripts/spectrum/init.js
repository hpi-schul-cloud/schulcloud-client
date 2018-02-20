$(document).ready(function () {
    $("input[type='color']").spectrum({
        showPaletteOnly: true,
        showPalette: true,
        hideAfterPaletteSelect: true,
        palette: [
            //dark
            [   '#9a0007',
                '#bb4d00',
                '#c17900',
                '#8c9900',
                '#005005',
                '#005662',
                '#004ba0',
                '#002984',
                '#29434e',
                '#4b2c20'],
            //normal
            [   '#d32f2f',  // rot
                '#f57c00',  // orange
                '#f9a825',  // gelb
                '#c0ca33',  // gelb-grün
                '#2e7d32',  // grün
                '#00838f',  // türkis
                '#1976d2',  // blau
                '#3f51b5',  // lila
                '#546e7a',  // blau-grau
                '#795548'], // braun
            //light
            [   '#ff6659',
                '#ffad42',
                '#ffd95a',
                '#b2ca70',
                '#60ad5e',
                '#4fb3bf',
                '#6d9aff',
                '#757de8',
                '#819ca9',
                '#a98274']

        ],
        change: function(color) {
            $(this).val(color.toHexString());
        }
    });
});
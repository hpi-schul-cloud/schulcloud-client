$(document).ready(function () {
    $("input[type='color']").spectrum({
        showPaletteOnly: true,
        showPalette: true,
        hideAfterPaletteSelect: true,
        palette: [
            ['#F44336',
                '#EC407A',
                '#B71C1C',
                '#AD1457',
                '#BA68C8',
                '#4A148C'],
            ['#9C27B0',
                '#673AB7',
                '#304FFE',
                '#2196F3',
                '#03A9F4',
                '#00BCD4'],
            ['#009688',
                '#4CAF50',
                '#8BC34A',
                '#C0CA33',
                '#607D8B',
                '#795548']
        ],
        change: function(color) {
            $(this).val(color.toHexString());
        }
    });
});
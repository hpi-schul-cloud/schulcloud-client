function writeFileSizePretty(filesize) {
    var unit;
    var iterator = 0;

    while (filesize > 1024) {
        filesize = Math.round((filesize / 1024) * 100) / 100;
        iterator++;
    }
    switch (iterator) {
        case 0:
            unit = "B";
            break;
        case 1:
            unit = "KB";
            break;
        case 2:
            unit = "MB";
            break;
        case 3:
            unit = "GB";
            break;
        case 4:
            unit = "TB";
            break;
    }
    return (filesize + unit);
}
"use strict";
exports.__esModule = true;
var fs = require("fs");
var lyrics = "It's 9 o'clock on a Saturday, regular crowd shuffles in.  " +
    "There's an old man sittin' next to me, making love to his tonic and gin." +
    "He says 'son can you play me a memory'? I'm not really sure how it goes." +
    "But it's sad and its sweet and I knew it complete when I wore a younger man's clothes." +
    "la la la di di dah, la la di di dahhhhhh da da";
/*fs.writeFile('bjoel.txt', lyrics, (err) => {
    if (err) throw err;

    console.log("Lyrics saved!")
})*/
fs.appendFile('dmclean.txt', "American pie or something", function (err) {
    if (err)
        throw err;
    console.log("Lyrics appended!");
});

"use strict";

// Read all json lang files from `assetPath/common/lang`
// and writes `assetPath/common/js/strings.js` that exports a single
// object containg all of the translations (webtranslateit json format).
//
//     {
//         'en': {
//             'friends': 'Friends'
//         },
//         'es': {
//             'friends': 'Amigos'
//         }
//     }
// @todo (lucas) Support platform specific lang files. (ie ipod -> chromepod)
module.exports = function(ctx, done){
    var assetPath = nconf.get('ASSETS');
    return common.readdir(assetPath + '/common/lang').then(function(files){
        return when.all(files.map(function(file){
            return common.readFile(assetPath + '/common/lang/' + file, 'utf-8').then(function(data){
                return {
                    'lang': file.replace('.json', ''),
                    'data': JSON.parse(data)
                };
            });
        }));
    }).then(function(results){
        var data = {};
        results.forEach(function(result){
            data[result.lang] = result.data;
        });
        return data;
    }).then(function(data){
        var template = hbs.handlebars.compile(tpl),
            rendered = template({'data': JSON.stringify(data, null, 4)});
        return common.writeFile(assetPath + '/common/js/strings.js', rendered).then(function(){
            return rendered;
        });
    });
};
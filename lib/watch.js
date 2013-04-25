"use strict";

var when = require('when'),
    fs = require('fs'),
    nconf = require('nconf'),
    common = require('./common'),
    findit = require('findit');


// Watch all files for changes and rebuild everything when files
// updated/removed/added
module.exports = function watch(cb){
    var d = when.defer(),
        files,
        locks = {},
        nodeModulesRe = /\/node_modules\/.*\/node_modules/;

    files = findit.sync(nconf.get('WATCH_PATH')).filter(function(f){
        return f !== null && f.indexOf('.git') === -1  &&
            !nodeModulesRe.exec(f) &&  // don't watch node_modules of dependencies
            f.indexOf('node_modules/socket.io') === -1 &&
            f.indexOf('node_modules/jshint') === -1 &&
            f.indexOf('node_modules/express') === -1 &&
            f.indexOf('app.js') === -1 &&
            f.indexOf('bootstrap.js') === -1 &&
            f.indexOf('strings.js') === -1 &&
            f.indexOf('aapp.appcache.js') === -1 &&
            f.indexOf('app.css') === -1;
    });

    files.forEach(function(filename){
        fs.watch(filename, function(event){
            if(!locks[filename]){
                locks[filename] = true;
                cb("changed", filename);
                setTimeout(function(){
                    delete locks[filename];
                }, 500);
            }
        });
    });

    common.success('<= watching `'+nconf.get('WATCH_PATH')+'` ('+files.length+' files) for file changes');
    d.resolve(true);
    return d.promise;
};
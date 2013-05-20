"use strict";
var fs = require('fs'),
    glob = require('glob'),
    crypto = require('crypto'),
    async = require('async'),
    path = require('path');

function isGlob(s){
    return s.indexOf('/*') > -1;
}

function globToRegex(s){
    return new RegExp(s.replace(/\*?\*/, '(.*)'));
}

// @todo (lucas) Could context hold open resources that can be flushed to
// disk after a step is completed?
function Context(tpl){
    this.ready = false;
    this.keys = [];
    if(tpl){
        this.extend(tpl);
    }
    this.baseDir = path.dirname(process.argv[1]);
}

Context.prototype.path = function(src){
    var args = Array.prototype.slice.call(arguments, 0);
    // return path.resolve(this.baseDir, path.join(args));
    return path.resolve(this.baseDir, src);
};

Context.prototype.dest = function(key, src){
    return this[key][src].dest;
};

Context.prototype.getFileInfo = function(src, done){
    fs.stat(src, function(err, stats){
        if(err) {
            return done(err);
        }

        stats.src = src;
        if(!stats.isFile()){
            return done(null, stats);
        }
        fs.readFile(src, function(err, data){
            if(err) {
                return done(err);
            }

            stats.md5 =  crypto.createHash('md5').update(data).digest('hex');
            return done(null, stats);
        });
    });
};

Context.prototype.extend = function(o){
    for(var key in o){
        this[key] = o[key];
        this.keys.push(key);
    }
    return this;
};

Context.prototype.getConfig = function(){
    var o = {},
        self = this;

    (this.config.export || Object.keys(this.config)).map(function(key){
        o[key] = self.config[key];
    });
    o.environment = this.environment;
    return o;
};

Context.prototype.prepare = function(done){
    var self = this,
        tasks = [];

    tasks = this.keys.map(function(key){
        if(self[key] !== Object(self[key])){
            return null;
        }
        return function(callback){


            var v = Object.keys(self[key]);
            async.parallel(v.map(function(src){
                return function(cb){
                    if(isGlob(src)){
                        var dest = self[key][src].hasOwnProperty('dest') ?
                            self[key][src].dest : self[key][src];
                        dest = self.path('build/' + dest);

                        new glob.Glob(self.path(src), {'mark': true}, function(err, matches){
                            if(err){
                                return cb(err);
                            }
                            var re = globToRegex(self.path(src));

                            matches.map(function(match){
                                self[key][match] = {};
                                // Now for fun...
                                // Handle pages/*.jade: pages/$1.html
                                if(dest.indexOf('$') > -1){
                                    self[key][match].dest = match.replace(re, dest);
                                }
                                else{
                                    self[key][match].dest = dest;
                                }
                            });
                            delete self[key][src];
                            cb();
                        });
                    }
                    else {
                        self[key][self.path(src)] = {'dest': self.path('build/' + self[key][src])};
                        delete self[key][src];
                        cb();
                    }
                };
            }), callback);
        };
    }).filter(function(r){
        return r !== null;
    });
    async.parallel(tasks, function(err){
        if(err){
            return done(err);
        }
        self.ready = true;
        done();
    });
};

Context.prototype.runTask = function(name, done){
    return this.cookbook.exec(name, {}, done);
};

module.exports = Context;
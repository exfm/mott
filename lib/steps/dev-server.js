"use strict";

var express = require('express'),
    debug = require('debug')('mott:dev server');

module.exports = function(ctx, done){
    var app = ctx.app = express(),
        http = require('http'),
        socketio = require('socket.io'),
        io;


    ctx.server = http.createServer(app);
    io = socketio.listen(ctx.server, {'log level': 1});

    app.use(express.static(ctx.path('build')));

    app.all('*', function(req, res, next){
        if (!req.get('Origin')) return next();

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

        if ('OPTIONS' === req.method) return res.send(200);
        next();
    });


    app.get('/', function(req, res){
        return res.sendfile(ctx.path('build/index.html'));
    });

    app.on('change', function(){
        var ids = Object.keys(io.sockets.sockets);
        debug('Emitting change event to ' + ids.length + ' clients.');
        ids.map(function(id){
            io.sockets.sockets[id].emit('change');
        });
    });

    ctx.server.listen(8080, function(){
        debug('dev server running at http://localhost:8080\n' +
        'for live reloads, add the following to your pages: \n' +
        [
            '<script src="/socket.io/socket.io.js"></script>',
            '<script>',
            'var socket = io.connect("http://localhost:8080");',
            'socket.on("change", function(data){',
            '    console.log("Got change from server.");',
            '    // You could add some custom code here to reinitialize your',
            '    // app instead if you\'d like or do something nice like',
            '    // have a reload on change checkbox preference saved in ',
            '    // local storage.',
            '    location.reload();',
            '});',
            '</script>'
        ].join('\n'));
        done();
    });
};

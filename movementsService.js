/**
 * Created by mattpiekarczyk on 11/4/15.
 */
"use strict";

var commandlineParameters = {};

for(var i= 2, len=process.argv.length; i<len; i++){
    var argument = process.argv[i].split(':');
    commandlineParameters[argument[0]] = argument[1];
}

require('seneca')()
    .use('redis-transport')
    .use('movements', commandlineParameters)
    .listen({type:'redis', pin:'role:movements,cmd:get'})
    .listen({type:'redis', pin:'role:movements,cmd:query'})
    .listen({type:'redis', pin:'role:movements,cmd:add'})
    .listen({type:'redis', pin:'role:movements,cmd:modify'})
    .listen({type:'redis', pin:'role:movements,cmd:delete'})
;
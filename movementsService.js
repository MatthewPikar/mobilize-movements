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
    .use('movements', commandlineParameters)
//    .use('redis-queue-transport')
//    .listen({type:'redis-queue', pin:{role:'movements',cmd:'*'}})
    .listen({type:'tcp', port:'30010', pin:'role:movements'})
;
/**
 * Created by mattpiekarczyk on 11/4/15.
 */
"use strict"

var _ = require('lodash')
var options = {}

for(var i= 2, len=process.argv.length; i<len; i++){
    var argument = process.argv[i].split(':')
    options[argument[0]] = argument[1]
}

_.extend(options, {
    resourceName: 'movements',
    resourceFormat: {
        required$: ['name'],
        only$: ['id','name','topic','type','description', 'image', 'video', 'organizers'],
        name: 'string$',
        topic: 'string$',
        type: 'string$',
        description: 'string$',
        image: 'string$',
        video: 'string$'
    }
})

var resourceService = require('resource-service')
require('seneca')()
    .use('redis-transport')
    .use(resourceService, options)
    .listen({type:'redis', pin:'role:movements,cmd:get'})
    .listen({type:'redis', pin:'role:movements,cmd:query'})
    .listen({type:'redis', pin:'role:movements,cmd:add'})
    .listen({type:'redis', pin:'role:movements,cmd:modify'})
    .listen({type:'redis', pin:'role:movements,cmd:delete'})
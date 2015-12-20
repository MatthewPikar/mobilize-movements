/**
    Created by mattpiekarczyk on 9/19/15.

    Message Format
    --------------
    requestId: number
    status:     {code, message, description}
    error:      {error}
    limit:      integer (with hard set limit)
    skip:       integer
    fields:     [fields]
    sort:       field:boolean
    resources:  [{resource}]

 */
// todo implement limit, fields, sort, skip when moved to a db
/* Need to update the seneca-redis-transport module to support this
    fields$ supported by HMGET
    limit$, skip$, sort$ supported by SORT and lists
    examine guyellis/seneca-redis-store fork
*/
// todo: implement custom rules for array/object argument type detection
// todo: implement custom rule for detection of illegal characters (in fields for example)
// todo: externalize id generation
// todo: add seneca.close(); when moving to db
// todo: figure out why notempty$ and type$ don't work

"use strict";

/*var customRules = {
    rules:{
        container$: function(ctxt, cb){
            //var isContainer = ctxt.rule.spec;
            var val = ctxt.point;

            if(!(Array.isArray(val) || typeof(val) === 'object'))
                return ctxt.util.fail(ctxt, cb);
            return cb();
        }},
    msgs:{
        container$: 'The <%=property%> property is not an Array nor an Object.'
    },
    valid:{
        name: 'container$',
        rules:{type$:'boolean'}
    }
};*/

var _ = require('lodash'),
    Response = require('response'),
    parameterTest = require('parambulator'),
    Promise = require('bluebird'),
    asynch = require('async')
    ;

var movementFormat = {
    required$: ['name'],
    only$: ['id', 'name', 'description', 'image', 'organizers'],
    name: 'string$',
    description: 'string$',
    image: 'string$'
};

function generateId(){
    var len = 16;

    return _.random(Number.MAX_SAFE_INTEGER)
        .toString(16)
        .slice(0,len);
}

module.exports = function movements(options) {
    var seneca = this;
    var act = Promise.promisify(seneca.act, {context:seneca});

    options = seneca.util.deepextend({
        limit: 10,
        hardLimit: 20,
        sort: {},
        skip: 0,
        fields: [],
        query: "",
        store: {host:'127.0.0.1', port:'6379', user:'', password:''},
        debug: false
    },options);

    var response = new Response({context:'movements', debug:!!options.debug});

    seneca
        .add({init: 'movements'},                   initialize)
        .add({role: 'movements', cmd: 'query'},     queryMovements)
        .add({role: 'movements', cmd: 'get'},       getMovement)
        .add({role: 'movements', cmd: 'add'},       addMovements)
        .add({role: 'movements', cmd: 'modify'},    modifyMovement)
        .add({role: 'movements', cmd: 'delete'},    deleteMovement)
    ;

    function initialize(args, respond){
        //seneca.use('jsonfile-store', {
        seneca.use('redis-store', {
            options:{},
            uri: 'redis://' +
                 //options.store.user + ':' + options.store.password +
                 '@' + options.store.host + ':' + options.store.port,
            map:{'-/-/movement':'*'}
        //    folder:'data'
        });

        return respond();
    }

    function queryMovements(args, respond) {
        var res = {requestId: args.requestId, request:'query'};
        var startTime = Date.now();

        var parameterFormat = parameterTest({
            required$:  ['requestId'],
            notempty$:  ['requestId'],
            requestId:  'string$',
            fields:     {type$:'array', '*': {type$:'string$', required$:true}}
        }).validate(args, function (err) {
            if (err) return response.make(400, _.extend(res, {error: {property: err.parambulator.property}}), respond);

            if( args.requestId === null || args.requestId === "")
                return response.make(400, res, respond);

            var params = {};

            // Catch any critical formatting errors that were not caught by the rules.
            try {
                // Load defaults if not provided in call.
                params = {
                    query: (typeof(args.query) === 'string') ? args.query.replace(/[^\w\s]/gi, ' ') : options.query,
                    limit: (typeof(args.limit) === 'number') ? args.limit > options.hardLimit ? options.hardLimit : args.limit : options.limit,
                    skip: (typeof(args.skip) === 'number') ? args.skip : options.skip,
                    fields: (args.fields) ? args.fields : options.fields,
                    sort: options.sort
                };

                /*if(
                 typeof(args.sort === 'object') &&
                 (_.size(args.sort) === 1) &&
                 _.includes(movementFormat.only$, (args.sort)) &&
                 typeof(_.values(args.sort)[0]) === 'boolean'
                 ) {
                 var sortField = ((_.keys(args.sort))[0]),
                 sortOrder = ((_.values(args.sort))[0] ? 1 : -1);
                 params.sort = {sortField:sortOrder};
                 //params.sort = { ((_.keys(args.sort))[0])  :  ((_.values(args.sort))[0] ? 1 : -1) };
                 }*/
            } catch(err) {
                return response.make(400, _.extend(res, {error: err}), respond);
            }

            res = _.extend({requestId: args.requestId}, params);
            if (!(typeof args.query === "undefined"  || args.query === "")) {
                seneca.make$('movement').list$(
                    {name: params.query},//,limit$:params.limit,skip$:params.skip,fields$:params.fields,sort$:params.sort},
                    function (err, resources) {
                        if(err) return response.make(400, _.extend(res, {error: err}), respond);
                        else if(!resources || resources.length === 0)
                            return response.make(204, _.extend(res, {
                                latency: Date.now()-startTime
                            }), respond);
                        else {
                            for(var i = 0, len = resources.length; i<len; i++)
                                resources[i] = resources[i].data$(false);

                            return response.make(200, _.extend(res, {
                                latency: Date.now()-startTime,
                                resources:resources
                            }), respond);
                        }
                });
            } else {
                seneca.make$('movement').list$(
                    //{limit$:params.limit, skip$:params.skip, fields$:params.fields,sort$:params.sort},
                    function (err, resources) {
                        if(err) return response.make(400, _.extend(res, {error: err}), respond);
                        else if(!resources || resources.length === 0)
                            return response.make(204, res, respond);
                        else {
                            for(var i = 0, len = resources.length; i<len; i++)
                                resources[i] = resources[i].data$(false);

                            return response.make(200, _.extend(res, {
                                latency: Date.now()-startTime,
                                resources:resources
                            }), respond);
                        }
                });
    }});}

    function getMovement(args, respond) {
        var res = {requestId: args.requestId, request:'get:'+args.id};
        var startTime = Date.now();
        var parameterFormat = parameterTest({
            required$:  ['id', 'requestId'],
            notempty$:  ['id', 'requestId'],
            id:         'string$',
            requestId:  'string$',
            fields:     'array$'
        }).validate(args, function (err) {
            if (err) return response.make(400, _.extend(res, {error: {property: err.parambulator.property}}), respond);

            if( args.id === null || args.id === "" ||
                args.requestId === null || args.requestId === "")
                return response.make(400, res, respond);

            seneca.make$('movement').load$({id:args.id, fields$:args.fields}, function(err, movement) {
                if (err) return response.make(500, _.extend(res, {error: err}), respond);
                if (!movement) return response.make(404, res, respond);
                else return response.make(200, _.extend(res, {
                    latency: Date.now()-startTime,
                    resources:movement.data$(false)
                }), respond);
            });
        });
    }

    function addMovements(args, respond){
        var res = {requestId: args.requestId, request:'add'};
        var startTime = Date.now();
        var parameterFormat = parameterTest({
            required$:  ['requestId', 'resources'],
            notempty$:  ['requestId', 'resources'],
            requestId:  'string$',
            resources:  {type$:'array', '*': movementFormat}
        }).validate(args, function (err) {
            if (err) return response.make(400, _.extend(res, {error: {property: err.parambulator.property}}), respond);

            if (args.resources.length === 0) return response.make(400, _.extend(res, {error: new Error('No resources provided.')}), respond);
            if( args.requestId === null || args.requestId === "")
                return response.make(400, _.extend(res, {error: new Error('No requestId provided.')}), respond);

            // check if any of the resources already exist, fail if any do.
            asynch.some(
                args.resources,
                function(resource, callback){
                    seneca.make$('movement').load$(
                        {name: resource.name},
                        function (err, resources) {
                            if (err) return callback(false);
                            else if(!resources || resources.length === 0) return callback(false);
                            else return callback(true);
                });},
                function(result){
                    if(result) return response.make(409, res, respond);

                    // Non of the resources alredy exist, so create them!
                    else {
                        seneca.ready(function (err) {
                            if (err) return response.make(500, _.extend(res, {error: err}), respond);

                            asynch.map(
                                args.resources,
                                function(resource, callback){
                                    seneca.make$('movement', {
                                        id: generateId(),
                                        name: resource.name,
                                        description: resource.description,
                                        image: resource.image,
                                        organizers: resource.organizers
                                    }).save$(function (err, movement) {
                                        if (err) return callback(err);
                                        else {
                                            callback(null, movement.data$(false));
                                        }
                                    });
                                },
                                function(err, results){
                                    if (err) return response.make(500, _.extend(res, {error: err}), respond);
                                    else return response.make(201, _.extend(res, {
                                        latency: Date.now()-startTime,
                                        resources:results
                                    }), respond);
    });});}});});}

    function modifyMovement(args, respond){
        var res = {requestId: args.requestId, request:'modify'};
        var startTime = Date.now();
        var parameterFormat = parameterTest({
            required$:  ['requestId', 'resources'],
            notempty$:  ['requestId', 'resources'],
            requestId:  'string$',
            resources:  {type$:'array', '*': movementFormat}
        }).validate(args, function (err) {
            if (err) return response.make(400, _.extend(res, {error: {property: err.parambulator.property}}), respond);

            if (args.resources.length === 0) return response.make(400, _.extend(res, {error: new Error('No resources provided.')}), respond);
            if( args.requestId === null || args.requestId === "")
                return response.make(400, _.extend(res, {error: new Error('No requestId provided.')}), respond);

            // check if all of the resources exist, fail if any do not.
            asynch.some(
                args.resources,
                function(resource, callback){
                    seneca.make$('movement').load$(
                        {id: resource.id, fields$:['id']},
                        function (err, resources) {
                            if (err) return callback(false);
                            else if(!resources || resources.length === 0) return callback(true);
                            else return callback(false);
                        });
                },
                function(result){
                    if(result) return response.make(404, res, respond);

                    // All resources are valid, so modify them!
                    else {
                        seneca.ready(function (err) {
                            if (err) return response.make(500, _.extend(res, {error: err}), respond);

                            asynch.map(
                                args.resources,
                                function (modResource, callback) {
                                    seneca.make$('movement').load$(modResource.id, function (err, resource) {
                                        if (err) return callback(err);
                                        else {
                                            if (modResource.name)        resource.data$({name: modResource.name});
                                            if (modResource.description) resource.data$({description: modResource.description});
                                            if (modResource.image)       resource.data$({image: modResource.image});
                                            if (modResource.organizers)  resource.data$({organizers: modResource.organizers});

                                            resource.save$(function (err, movement) {
                                                if (err) return callback(err);
                                                else callback(null, movement.data$(false));
                                            });
                                    }});
                                },
                                function (err, results) {
                                    if (err) return response.make(500, _.extend(res, {error: err}), respond);
                                    else return response.make(200, _.extend(res, {
                                        latency: Date.now()-startTime,
                                        resources: results
                                    }), respond);
    });});}});});}

    function deleteMovement(args, respond){
        var res = {requestId: args.requestId, request:'delete:'+args.id};
        var startTime = Date.now();
        var parameterDescription = parameterTest({
            required$:  ['requestId', 'id'],
            notempty$:  ['requestId', 'id'],
            requestId:  'string$',
            id: 'string$'
        }).validate(args, function(err){
            if (err) return response.make(400, _.extend(res, {error: {property: err.parambulator.property}}), respond);

            if( args.id === null || args.id === "" ||
                args.requestId === null || args.requestId === "")
                return response.make(400, _.extend(res, {error: new Error('No resource id or requestId provided.')}), respond);

            seneca.make$('movement')
                .remove$(args.id, function(err, movement){
                if(err) return response.make(500, _.extend(res, {error: err}), respond);
                else if(!movement) return response.make(404, res, respond);
                else return response.make(204, _.extend(res, {
                            latency: Date.now()-startTime
                    }), respond);
            });
        });
    }
};
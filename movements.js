/**
 * Created by mattpiekarczyk on 9/19/15.
 */
// todo implement add multiple
// todo implement modify multiple
//
// Message Format
// --------------
// requestId: number
// status: {code, message, description}
// errors: [{code, message, description, stack}]
// limit: integer (with hard set limit)
// skip: integer
// fields: [fields]
// sort: field:boolean
// resources: [resources]/{resource}

"use strict";

var _ = require('lodash'),
    Response = require('./lib/response/response.js'),
    parameterTest = require('parambulator'),
    asynch = require('async')
    ;

var movementFormat = {
    required$: ['name'],
    only$: ['id', 'name', 'description', 'image', 'organizers'],
    name: 'string$',
    description: 'string$',
    image: 'string$'
};

var errorInternal = {
    http$: {status:500},
    why:   'Internal error.'
};

function generateId(){
    var len = 16;

    return _.random(Number.MAX_SAFE_INTEGER)
        .toString(16)
        .slice(0,len);
}

module.exports = function movements(options) {
    var seneca = this;

    options = seneca.util.deepextend({
        limit: 10,
        hardLimit: 20,
        sort: {},
        skip: 0,
        fields: []
    },options);

    seneca
        .add({init: 'movements'},                   initialize)
        .add({role: 'movements', cmd: 'query'},     queryMovements)
        .add({role: 'movements', cmd: 'get'},       getMovement)
        .add({role: 'movements', cmd: 'add'},       addMovements)
        .add({role: 'movements', cmd: 'modify'},    modifyMovement)
        .add({role: 'movements', cmd: 'delete'},    deleteMovement)
    ;

    function initialize(args, respond){
        seneca.use('jsonfile-store', {
            map:{'-/-/movement':'*'},
            folder:'data'
        });

        return respond();
    }

    function queryMovements(args, respond) {
        var errorTriggered = false;

        var parameterDescription = parameterTest({
            query:      {type$:'string'},
            limit:      {type$:'integer'},
            skip:       {type$:'integer'},
            sort:       {type$:'object', '*': {type$:'boolean', required$:true}},
            fields:     {type$:'array'}
        });

        parameterDescription.validate(args, function (err) {
            if (err) {
                errorTriggered = true;
                return respond(err, null);
            }
        });

        if (errorTriggered) return null;

        //if (args.test != true)
        //    return respond(new Error("Test failed to catch!!"));

        // todo: figure out why query parameters are not working
        // Load defaults if options not provided in call.
        var limit = (typeof args.limit !== "undefined") ? args.limit > options.hardLimit ? options.hardLimit : args.limit : options.limit;
        var skip = (typeof args.skip !== "undefined") ? args.skip : options.skip;
        var fields = (typeof args.fields !== "undefined") ? args.fields : options.fields;
        var sort = (typeof args.sort !== "undefined") ? args.sort : options.sort;
        var query = args.query;

        //var sort = options.sort;
        // todo: turn boolean sort to -1/1 for ascending/descending

        if (typeof args.query !== "undefined") {
            seneca.make$('movement').list$(
                {name: query, limit$:limit, skip$:skip, fields$:fields, sort$:sort},
                function (err, movements) {
                    if(err) return respond(err, null);
                    else if(!movements || movements.length === 0) {


                        return respond(null, {
                            http$: {status: 401},
                            why: "No resources matching " + query + " found."
                        });
                    }
                    else {
                        for(var i = 0, len = movements.length; i<len; i++)
                            movements[i] = movements[i].data$(false);

                        return respond(null, {count: movements.length, movements:movements});
                    }
            });
        } else {
            seneca.make$('movement').list$(
                {sort$:sort, limit$:limit, skip$:skip, fields$:fields},
                function (err, movements) {
                    if(err) return respond(null, errorInternal);
                    else if(!movements || movements.length === 0)
                        return respond(null, {
                            http$: {status:401},
                            why:   "No resources found."
                        });
                    else {
                        for(var i = 0, len = movements.length; i<len; i++)
                            movements[i] = movements[i].data$(false);

                        return respond(null, {count: movements.length, movements:movements});
                    }
            });
        }
    }

    // responds true if any of the provided movements exist

    function getMovement(args, respond) {
        var response = new Response({requestId: args.requestId}, respond);
        var parameterFormat = parameterTest({
            required$:  ['id', 'requestId'],
            id:         'string$',
            requestId:  'string$',
            fields:     'array$'
        }).validate(args, function (err) {
            if (err) return response.make(400, {error: err});

            seneca.make$('movement').load$({id:args.id, fields$:args.fields}, function(err, movement) {
                if (err) return response.make(500, {error: err});
                if (!movement) return response.make(404, {detail: args.id});
                else return response.make(200, {resources:movement.data$(false)});
            });
        });
    }

    // todo: check if resource already exists
    // todo: add seneca.close(); when moving to db
    function addMovements(args, respond){
        var response = new Response({requestId: args.requestId}, respond);
        var parameterFormat = parameterTest({
            required$:  ['requestId', 'resources'],
            requestId:  'string$',
            resources:  {type$:'array', '*': movementFormat}
        }).validate(args, function (err) {
            if (err) return response.make(400, {error: err});

            // check if any of the resources already exist, fail if any do.
            asynch.some(
                args.resources,
                function(resource, callback){
                    seneca.make$('movement').list$(
                        {name: resource.name, fields$:['name']},
                        function (err, resources) {
                            if (err) return callback(false);
                            else if(!resources || resources.length === 0) return callback(false);
                            else return callback(true);
                        });
                },
                function(result){
                    if(result) return response.make(409);
                }
            );

            seneca.ready(function (err) {
                if (err) return response.make(500, {error: err});

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
                            else callback(null, movement.data$(false));
                        });
                    },
                    function(err, results){
                        if (err) return response.make(500, {error: err});
                        else return response.make(201, {resources:results});
                    }
                );
            });
        });
    }

    // todo: check if resource already exists
    // todo: add seneca.close(); when moving to db
    function modifyMovement(args, respond){
        var response = new Response({requestId: args.requestId}, respond);
        var parameterFormat = parameterTest({
            required$:  ['requestId', 'resources'],
            requestId:  'string$',
            resources:  {type$:'array', '*': movementFormat}
        }).validate(args, function (err) {
            if (err) return response.make(400, {error: err});

            // check if all of the resources exist, fail if any do not.
            asynch.some(
                args.resources,
                function(resource, callback){
                    seneca.make$('movement').list$(
                        {id: resource.id, fields$:['id']},
                        function (err, resources) {
                            if (err) return callback(false);
                            else if(!resources || resources.length === 0) return callback(true);
                            else return callback(true);
                        });
                },
                function(result){
                    if(result) return response.make(404);
                }
            );

            seneca.ready(function (err) {
                if (err) return response.make(500, {error: err});

                asynch.map(
                    args.resources,
                    function (modResource, callback) {
                        seneca.make$('movement').load$(modResource.id, function (err, resource) {
                            if (err) return callback(err);
                            else {
                                if (modResource.name)        resource.data$({name: modResource.name});
                                if (modResource.description) resource.data$({description: modResource.description});
                                if (modResource.image)       resource.data$({image: args.movement.image});
                                if (modResource.organizers)  resource.data$({organizers: modResource.organizers});
                            }
                        }).save$(function (err, movement) {
                            if (err) return callback(err);
                            else callback(null, movement.data$(false));
                        });
                    },
                    function (err, results) {
                        if (err) return response.make(500, {error: err});
                        else return response.make(200, {resources: results});
                    }
                );
            });
        });
    }

    function deleteMovement(args, respond){
        var response = new Response({requestId: args.requestId}, respond);
        var parameterDescription = parameterTest({
            required$:  ['requestId', 'id'],
            requestId:  'string$',
            id: 'string$'
        }).validate(args, function(err){
            if (err) return response.make(400, {error: err});

            seneca.make$('movement').remove$(args.id, function(err, movement){
                if(err) return response.make(400, {error: err});
                else if(!movement) return response.make(404, {detail: "resource id:" + args.id});
                else return response.make(204, {detail: "Resource: " + args.id + " successfully removed."});
            });
        });
    }
};
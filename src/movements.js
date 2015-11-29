/**
 * Created by mattpiekarczyk on 9/19/15.
 */
"use strict";

// todo: replace crypto with lodash
var crypto = require('crypto');
var parameterTest = require('parambulator');
var error = require('eraro')({module:'movements'});

module.exports = function movements(options) {
    var seneca = this;

    options = seneca.util.deepextend({
        limit: 10,
        sort: {},
        skip: 0,
        fields: []
    },options);

    var error_internal = {
        http$: {status:500},
        why:   'Internal error.'
    };

    function parseJSON(o) {
        return null == o ? {} : _.isString(o) ? JSON.parse(o) : o;
    }

    seneca
        .add({init: 'movements'},                   initialize)
        .add({role: 'movements', cmd: 'query'},     queryMovements)
        .add({role: 'movements', cmd: 'get'},       getMovement)
        .add({role: 'movements', cmd: 'add'},       addMovement)
        .add({role: 'movements', cmd: 'modify'},    modifyMovement)
        .add({role: 'movements', cmd: 'delete'},    deleteMovement)
    ;

    function initialize(args, respond){
        seneca.use('jsonfile-store', {
            map:{'-/-/movement':'*'},
            folder:'./data'
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
        }).validate(args, function (err, res) {
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
        var limit = (typeof args.limit !== "undefined") ? args.limit : options.limit;
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
                    else if(!movements || movements.length == 0) {


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
                    if(err) return respond(null, error_internal);
                    else if(!movements || movements.length == 0)
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

    function getMovement(args, respond) {
        var parameterDescription = parameterTest({id:{type$:'string', required$:true}});
        if(typeof args.id === "undefined") respond(null, {
            http$: {status:401},
            why:   "Incomplete request.  Movement ID is missing."
        });

        this.make$('movement').load$(args.id, function(err, movement){
            if(err) return respond(null, error_internal);
            if(!movement) return respond(null, {
                http$: {status:401},
                why:   "Resource " + args.id + " does not exist."
            });

            return respond(null,movement.data$(false));
        });
    }

    function addMovement(args, respond){
        var parameterDescription = parameterTest({id:{type$:'string', required$:true}});
        if(typeof args.movement === "undefined") return respond(null, {
            http$: {status: 401},
            why: "Incomplete request.  New movement data is missing."
        });

        var movement = seneca.make$('movement', {
            id: generateId(),
            name: args.movement.name,
            description: args.movement.description,
            image: args.movement.image,
            organizers: args.movement.organizers,
            events: args.movement.events,
            news: args.movement.news
        });

        seneca.ready(function(err){
            if(err) return respond(null, error_internal);

            movement.save$(function(err, movement){
                if(err) return respond(null, error_internal);
                return respond(null,movement.data$(false));
            });
        });
        //seneca.close();
    }

    function modifyMovement(args, respond){
        var parameterDescription = parameterTest({
                id:{type$:'string', required$:true},
                movement:{required$:true}
            }).validate(args, function(err){return respond(err, null)});

        if(typeof args.movement === "undefined") respond(null, {
            http$: {status: 401},
            why: "Incomplete request.  New movement data is missing."
        });
        else if(typeof args.id === "undefined") return respond(null, {
            http$: {status:401},
            why:   "Incomplete request.  Movement ID is missing."
        });

        this.make$('movement').load$(args.id, function(err, movement){
            if(err) return respond(null, error_internal);
            if(!movement) return respond(null, {
                http$: {status:401},
                why:   "Resource " + args.id + " does not exist."
            });
            else {
                if(args.movement.name) movement.data$({name: args.movement.name});
                if(args.movement.description) movement.data$({description: args.movement.description});
                if(args.movement.image) movement.data$({image: args.movement.image});
                if(args.movement.organizers) movement.data$({organizers: args.movement.organizers});
                if(args.movement.events) movement.data$({events: args.movement.events});
                if(args.movement.news) movement.data$({news: args.movement.news});

                seneca.ready(function(err){
                    if(err) return respond(null, error_internal);

                    movement.save$(function(err, movement){
                        if(err) return respond(null, error_internal);
                        return respond(null,movement.data$(false));
                    });
                });
                //seneca.close();
            }
        });
    }

    function deleteMovement(args, respond){
        var parameterDescription = !parameterTest({id: {type$: 'string', required$: true}})
            .validate(args, function(err){return respond(err, null)});

        if(typeof args.id === "undefined") return respond(null, {
            http$: {status:401},
            why:   "Incomplete request.  Movement ID is missing."
        });

        this.make$('movement').remove$(args.id, function(err, movement){
            if(err)
                return respond(null, error_internal);
            else if(!movement) {
                return respond(null, {
                    http$: {status:401},
                    why:   "Resource " + args.id + " does not exist."
                });

            } else
                return respond(null, {message:"Resource " + args.id + " removed."});
    })}

    function generateId(){
        var len = 16;

        return crypto.randomBytes(Math.ceil(len/2))
            .toString('hex')
            .slice(0,len);
    }

    //return {name: 'movements'};
};
"use strict";

var assert = require('assert');
var seneca = require('seneca')()
    .use('../movements');

var resourceId = [];

describe('movements', function(){
    // Message Format
    // --------------
    // requestId: number
    // status: {code, message, description}
    // errors: [{code, message, description, stack}]
    // limit, skip, fields
    // resources: [resources]/{resource}
    // get should
    //      200, return the correct resource given it's id
    //      200, return only the requested fields of the resource
    //      404, return a "not found" status if the resource does not exist.
    //      400, return an error if id was not supplied
    // add should
    //      201, add the resource as long as unique name and author are provided
    //      409, return an error if another resource with the same name already exists
    //      400, return an error if name or author are not provided
    //      400, return an error if any provided resource fields are of wrong format
    // modify should
    //      200, modify the resource whose id is provided with only the fields which are provided.
    //      400, return an error if id or fields to change are not provided
    //      400, return an error if any provided resource fields are of wrong format
    //      401, return an error removing self as author
    //      401, return an error if the user making the change is not an author
    // query should
    //      200, return an array of resources matching the field=query string
    //      200, return only the requested fields of the resource
    //      200/206, return all resources if no query is given
    //      200/206, return resources with the proper limit, skip, and sort.
    //      206, return no more resources than allowed by max limit.
    //      200+400, return ignore incorrect values provided in options, but provide a status message alerting of the error
    // delete should
    //      204, delete the resource specified by the id
    //      404, return an error if the resource does not exist
    //      400, return an error if the id field was not provided
    // status codes
    //      200 - ok
    //      201 - created
    //      204 - no content
    //      400 - bad request
    //      401 - unauthorised
    //      403 - forbidden
    //      404 - not found
    //      405 - method not allowed
    //      422 - unprocessable entity
    // query
    // add x
    // modify x
    // get x
    // add y
    // add x - err
    // query xy
    /*
    describe('query', function(){
        it('should return all movements when qury is not provided', function(done){
            seneca({log:'silent', errhandler:done})
                .act({role:'movements', cmd:'query'}, function(err, res){
                    if(err) return done(err);

                    assert.

                    done();
                });
        });
    });
    */
    // delete y
    // get y - err
    // modify y - err
    // delete y - err
    // query

    describe('add', function(){
        it('Should return a 400 status if requestId parameter is missing or malformed.', function(done){
            seneca
                .act({role:'movements', cmd:'add'}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                    seneca
                        .act({role:'movements', cmd:'add', requestId:false}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                            done();
                        });
                });
        });
        it('Should return a 400 status if required resource fields are missing, malformed, or have unexpected fields.', function(done){
            var resource = [{
                "description":"on every face",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];

            // Missing
            seneca
                .act({role:'movements', cmd:'add', requestId:'test4', resources:resource}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Required resource fields are missing.");

                    // Bad type
                    var resource = [{
                        "name":false,
                        "description":0,
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];

                    seneca
                        .act({role:'movements', cmd:'add', requestId:'test5', resources:resource}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 400, "Wrong format: Returned Status code is not 400: " + res.status.code);

                            // Malformed
                            var resource = [{
                                "name":"foo",
                                "description":"foo",
                                "image":"I see a nose in every place",
                                "organizers":[{"name":"matt"},{"name":"sharothi"}]
                            }];
                            resource = JSON.stringify(resource);

                            seneca
                            // check for return status and created resource
                                .act({role:'movements', cmd:'add', requestId:'test6', resources:resource}, function(err, res){
                                    if(err) return done(err);
                                    assert.equal(res.status.code, 400, "Malformed resource: Returned Status code is not 400: " + res.status.code);

                                    // unexpected fields
                                    var resource = [{
                                        "test":"test",
                                        "name":"foo",
                                        "description":0,
                                        "image":"I see a nose in every place",
                                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                                    }];
                                    resource = JSON.stringify(resource);

                                    seneca
                                    // check for return status and created resource
                                        .act({role:'movements', cmd:'add', requestId:'test7', resources:resource}, function(err, res){
                                            if(err) return done(err);
                                            assert.equal(res.status.code, 400, "Unexpected fields: Returned Status code is not 400: " + res.status.code);

                                            done();
                                        });
                                });
                        });
                });
        });
        var resource = [{
            name:"i see a nose",
            description:"on every face",
            image:"I see a nose in every place",
            organizers:[{"name":"matt"},{"name":"sharothi"}]
        }];
        it('Should return a 201 status and add the provided resources, but ignore any id fields.', function(done){


            // Single resource
            seneca
                .act({role:'movements', cmd:'add', requestId:'test1', resources:resource}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 201, "Returned Status code is not 201: " + res.status.code);
                    assert.notDeepEqual(res.resources, 'undefined', "Resource not returned.");
                    assert.notDeepEqual(res.resources, [], "Resource not returned.");
                    resourceId[0] = res.resources[0].id;

                    // multiple resources
                    var resources = [
                        {
                            "name":"wheel on the bus go",
                            "description":"round and round, round and round",
                            "image":"wheels on the bus go round and round, all around the town",
                            "organizers":[{"name":"matt"},{"name":"sharothi"}]
                        },
                        {
                            "name":"brown bear brown bear",
                            "description":"what do you see",
                            "image":"I see a red bird looking at me",
                            "organizers":[{"name":"matt"},{"name":"sharothi"}]
                        }
                    ];

                    seneca
                        .act({role:'movements', cmd:'add', requestId:'test2', resources:resources}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 201, "Returned Status code is not 201: " + res.status.code);
                            assert.notDeepEqual(res.resources, 'undefined', "Resource not returned.");
                            assert.equal(resources.length, res.resources.length, "Wrong number of resources returned.");
                            resourceId[1] = res.resources[0].id;
                            resourceId[2] = res.resources[1].id;
                            done();
                        });
                });
        });
        it('Should return a 409 status if any of the the provided resource(s) already exist.', function(done){


            seneca.act({role:'movements', cmd:'add', requestId:'test4', resources:resource}, function(err, res){
                if(err) return done(err);
                assert.equal(res.status.code, 409, "Returned Status code is not 409: " + res.status.code);

                done();
            });
        });
    });

    describe('get', function(){
        // todo: it should and provide an error status if an internal error occured and log it.
        // todo: add field support when moving to a db
        /* it('Should return only the fields specified in the fields argument (id is always returned).', function(done){
            var fields = ['name','description'];
            seneca
                .act({role:'movements', cmd:'get', requestId:'test', id:'2f888f2ecfc1c2ca', fields:fields}, function(err, res){
                    if(err) return done(err);

                    assert.equal(Object.keys(res.resources).length, fields.length + 1, Object.keys(res.resources).length +1 + " fields returned, " + (fields.length+1) + " expected.")

                    assert.notDeepEqual(typeof res.resources['id'], "undefined", "id field was not returned.")

                    for(var i=0, len=fields.length; i<len; i++){
                        assert.notDeepEqual(typeof res.resources[fields[i]], "undefined", fields[i] + " field was not returned.")
                    }
                });

            done();
        });*/
        it('Should return a 400 status if requestId argument is not provided or malformed.', function(done){
            seneca
                .act({role:'movements', cmd:'get', id:resourceId[0]}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                    seneca
                        .act({role:'movements', cmd:'get', requestId:false, id:resourceId[0]}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                            done();
                        });
                });
        });
        it('Should return a 400 status if id argument is not provided or malformed.', function(done){
            seneca
                .act({role:'movements', cmd:'get', requestId:'test4.2'}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Missing id: Returned Status code is not 400: " + res.status.code);
                    seneca
                        .act({role:'movements', cmd:'get', requestId:'test4.3', id:0}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 400, "Bad id: Returned Status code is not 400: " + res.status.code);
                            done();
                        });
                });
        });
        it('Should return a 400 status when fields argument (if provided) is malformed.', function(done){
            var fields = 0;
            seneca
                .act({role:'movements', cmd:'get', requestId:'test5', id:resourceId[0], fields:fields}, function(err, res){
                    if(err) return done(err);

                    assert.equal(res.status.code, 400, "Bad fields: Returned Status code is not 400: " + res.status.code);

                    done();
                });
        });
        it('Should return a 404 status if the movement does not exist.', function(done){
            seneca
                .act({role:'movements', cmd:'get', requestId:'test3', id:'-test no id-'}, function(err, res){
                    if(err) return done(err);

                    // check the status code
                    assert.equal(res.status.code, 404, "Returned Status code is not 404: " + res.status.code);

                    done();
                });
        });
        it('Should return a 200 status along with the movement corresponding to the provided id.', function(done){
            seneca
                .act({role:'movements', cmd:'get', requestId:'test1', id:resourceId[0]}, function(err, res){
                    if(err) return done(err);

                    // check the status code
                    assert.equal(res.status.code, 200, "Returned Status code is not 200: " + res.status.code);
                    // check that the correct resource is returned
                    assert.equal(res.resources.id, resourceId[0], "Wrong resource returned.");

                    done();
                });
        });
    });

    describe('modify', function(){
        it('Should return a 400 status if the id or requestId fields are missing or malformed.', function(done){
            done();
        });
        it('Should return a 400 status if any of the resources is missing or malformed.', function(done){
            done();
        });
        it('Should return a 404 status if any of the target resources is not found.', function(done){
            done();
        });
        it('Should return status and modify and return the target resource.', function(done){
            done();
        });
    });

    describe('delete', function(){
        it('Should return a 400 status if requestId is not provided.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', id:resourceId[0]}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "No requestId: Returned Status code is not 404: " + res.status.code);
                    done();
                });
        });
        it('Should return a 400 status if requestId was malformed.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', requestId:0, id:resourceId[0]}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 404: " + res.status.code);
                    done();
                });
        });
        it('Should return a 400 status if id is not provided.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', requestId:"test"}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "No requestId: Returned Status code is not 404: " + res.status.code);
                    done();
                });
        });
        it('Should return a 400 status if id was malformed.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', requestId:"test", id:0}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 404: " + res.status.code);
                    done();
                });
        });
        it('Should return a 404 status if the specified resource does not exist.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', requestId:"test1", id:"test"}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 404, "Delete non existing: Returned Status code is not 404: " + res.status.code);
                    done();
                });
        });
        it('Should return a 204 status and delete the resource whose id is specified.', function(done){
            seneca
                .act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[0]}, function(err, res){
                    if(err) return done(err);
                    assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: " + res.status.code);

                    seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[1]}, function(err, res){
                        if(err) return done(err);
                        assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: " + res.status.code);

                        seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[2]}, function(err, res){
                            if(err) return done(err);
                            assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: " + res.status.code);
                            done();
                });});});
        });
    });
});
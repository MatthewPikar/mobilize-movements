// Message Format
// --------------
// requestId: number
// status: {code, message, description}
// errors: [{code, message, description, stack}]
// limit, skip, fields
// resources: [resources]/{resource}

// todo: mock out db access using rewire and sinon
// todo: test against naughty/unsafe inputs
// todo: it should and provide an error status if an internal error occured and log it.
// todo: add field support when moving to a db


"use strict";

var assert = require('assert'),
    asPromised = require('chai-as-promised'),
    chai = require('chai')
        .use(asPromised),
    expect = chai.expect,
    async = require('async'),
    seneca = require('seneca')()
        .use('../movements'),
    Promise = require('bluebird'),
    act = Promise.promisify(seneca.act, {context:seneca})
    ;

/*
var resourceId = [];


describe('movements', function(){
    describe('add', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(done){
            async.parallel([
                // requestId missing
                function(callback){
                    seneca.act({role:'movements', cmd:'add'}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                        callback();
                });},
                // requestId malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'add', requestId:false}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                        callback();
                });},
                // resource missing
                function(callback){
                    var resource = [{
                        "description":"on every face",
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];

                    seneca.act({role:'movements', cmd:'add', requestId:'test4', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Required resource fields are missing.");
                        callback();
                });},
                // resource bad type
                function(callback){
                    var resource = [{
                        "name":false,
                        "description":0,
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];

                    seneca.act({role:'movements', cmd:'add', requestId:'test5', resources:resource}, function(err, res){
                        if(err) return done(err);
                        assert.equal(res.status.code, 400, "Wrong format: Returned Status code is not 400: " + res.status.code);
                        callback();
                });},
                // resource malformed
                function(callback){
                    var resource = [{
                        "name":"foo",
                        "description":"foo",
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];
                    resource = JSON.stringify(resource);

                    seneca.act({role:'movements', cmd:'add', requestId:'test6', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Malformed resource: Returned Status code is not 400: " + res.status.code);
                        callback();
                });},
                // resource unexpected fields
                function(callback){
                    var resource = [{
                        "test":"test",
                        "name":"foo",
                        "description":0,
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];
                    resource = JSON.stringify(resource);

                    seneca.act({role:'movements', cmd:'add', requestId:'test7', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Unexpected fields: Returned Status code is not 400: " + res.status.code);
                        callback();
                });}
            ],  function(err, results) {
                    if(err) return done(err);
                    done();
            });
        });
        it('Should return a 201 status and add the provided resource(s), but ignore any id fields.', function(done){
            async.parallel([
                // Single resource
                function(callback){
                    var resource = [{
                        name:"i see a nose",
                        description:"on every face",
                        image:"I see a nose in every place",
                        organizers:[{"name":"matt"},{"name":"sharothi"}]
                    }];
                    seneca.act({role:'movements', cmd:'add', requestId:'test1', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 201, "Returned Status code is not 201: " + res.status.code);
                        assert.notDeepEqual(res.resources, 'undefined', "Resource not returned.");
                        assert.notDeepEqual(res.resources, [], "Resource not returned.");
                        resourceId.push(res.resources[0].id);

                        callback();
                });},
                // multiple resources
                function(callback){
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

                    seneca.act({role:'movements', cmd:'add', requestId:'test2', resources:resources}, function(err, res){
                        if(err) return done(err);
                        assert.equal(res.status.code, 201, "Returned Status code is not 201: " + res.status.code);
                        assert.notDeepEqual(res.resources, 'undefined', "Resource not returned.");
                        assert.equal(resources.length, res.resources.length, "Wrong number of resources returned.");
                        resourceId.push(res.resources[0].id);
                        resourceId.push(res.resources[1].id);
                        callback();
                });}
            ],  function(err, results) {
                if(err) return done(err);
                done();
            });
        });
        it('Should return a 409 status if any of the the provided resource(s) already exist.', function(done){
            var resource = [{
                name:"i see a nose",
                description:"on every face",
                image:"I see a nose in every place",
                organizers:[{"name":"matt"},{"name":"sharothi"}]
            }];

            seneca.act({role:'movements', cmd:'add', requestId:'test1', resources:resource}, function(err, res){
                if(err) return done(err);
                assert.equal(res.status.code, 409, "Returned Status code is not 409: " + JSON.stringify(res));
                done();
            });
        });
    });
    describe('get', function() {
        it('Should return a 400 status if any arguments are missing or malformed.', function (done) {
            async.parallel([
                // requestId missing
                function (callback) {
                    seneca.act({role: 'movements', cmd: 'get', id: resourceId[0]}, function (err, res) {
                        if (err) return callback(err);
                        assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });
                },
                // requestId malformed
                function (callback) {
                    seneca.act({
                        role: 'movements',
                        cmd: 'get',
                        requestId: false,
                        id: resourceId[0]
                    }, function (err, res) {
                        if (err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });
                },
                // id missing
                function (callback) {
                    seneca.act({role: 'movements', cmd: 'get', requestId: 'test4.2'}, function (err, res) {
                        if (err) return callback(err);
                        assert.equal(res.status.code, 400, "Missing id: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });
                },
                // id malformed
                function (callback) {
                    seneca.act({role: 'movements', cmd: 'get', requestId: 'test4.3', id: 0}, function (err, res) {
                        if (err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad id: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });
                },
                // fields malformed
                function (callback) {
                    seneca.act({
                        role: 'movements',
                        cmd: 'get',
                        requestId: 'test5',
                        id: resourceId[0],
                        fields: 0
                    }, function (err, res) {
                        if (err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad fields: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });
                }
            ], function (err, results) {
                if (err) return done(err);
                done();
            });
        });
        it('Should return a 404 status if the movement does not exist.', function (done) {
            seneca
                .act({role: 'movements', cmd: 'get', requestId: 'test3', id: '-test no id-'}, function (err, res) {
                    if (err) return done(err);

                    // check the status code
                    assert.equal(res.status.code, 404, "Returned Status code is not 404: " + res.status.code);

                    done();
                });
        });
        it('Should return a 200 status along with the movement corresponding to the provided id.', function (done) {
            seneca
                .act({role: 'movements', cmd: 'get', requestId: 'test1', id: resourceId[0]}, function (err, res) {
                    if (err) return done(err);

                    // check the status code
                    assert.equal(res.status.code, 200, "Returned Status code is not 200: " + JSON.stringify(res));
                    // check that the correct resource is returned
                    assert.equal(res.resources.id, resourceId[0], "Wrong resource returned.");

                    done();
                });
        });
    });
    describe('modify', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(done){
            async.parallel([
                // requestId missing
                function(callback){
                    seneca.act({role:'movements', cmd:'modify'}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                        callback();
                    });},
                // requestId malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'modify', requestId:false}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                        callback();
                    });},
                // resource missing
                function(callback){
                    var resource = [{
                        "description":"on every face",
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];

                    seneca.act({role:'movements', cmd:'modify', requestId:'test4', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Required resource fields are missing.");
                        callback();
                    });},
                // resource bad type
                function(callback){
                    var resource = [{
                        "name":false,
                        "description":0,
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];

                    seneca.act({role:'movements', cmd:'modify', requestId:'test5', resources:resource}, function(err, res){
                        if(err) return done(err);
                        assert.equal(res.status.code, 400, "Wrong format: Returned Status code is not 400: " + res.status.code);
                        callback();
                    });},
                // resource malformed
                function(callback){
                    var resource = [{
                        "name":"foo",
                        "description":"foo",
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];
                    resource = JSON.stringify(resource);

                    seneca.act({role:'movements', cmd:'modify', requestId:'test6', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Malformed resource: Returned Status code is not 400: " + res.status.code);
                        callback();
                    });},
                // resource unexpected fields
                function(callback){
                    var resource = [{
                        "test":"test",
                        "name":"foo",
                        "description":0,
                        "image":"I see a nose in every place",
                        "organizers":[{"name":"matt"},{"name":"sharothi"}]
                    }];
                    resource = JSON.stringify(resource);

                    seneca.act({role:'movements', cmd:'modify', requestId:'test7', resources:resource}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Unexpected fields: Returned Status code is not 400: " + res.status.code);
                        callback();
                    });}
            ],  function(err, results) {
                if(err) return done(err);
                done();
            });
        });
        it('Should return a 404 status if any of the resources do not exist.', function(done){
            var resource = [{
                "name":"foo",
                "description":"foo",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            seneca.act({role:'movements', cmd:'modify', requestId:'test', resources:resource}, function(err, res){
                if(err) return done(err);

                assert.equal(res.status.code, 404, "Returned Status code is not 404: " + res.status.code);
                done();
            });
        });
        it('Should return a 200 status and modify and return the target resource(s).', function(done){
            var resources = [
                {
                    "id": resourceId[1],
                    "name":"wheel",
                    "description":"round and round, round and round",
                    "image":"wheels on the bus go round and round, all around the town",
                    "organizers":[{"name":"matt"},{"name":"sharothi"}]
                },
                {
                    "id": resourceId[2],
                    "name":"brown bear brown bear",
                    "description":"see",
                    "image":"me",
                    "organizers":[{"name":"matt"},{"name":"sharothi"}]
                }
            ];
            seneca.act({role:'movements', cmd:'modify', requestId:'test', resources:resources}, function(err, res){
                if(err) return done(err);

                assert.deepEqual(res.status.code, 200, "Returned Status code is not 200: " + res.status.code);
                assert.deepEqual(resources[0].name, res.resources[0].name, "Resource hasn't been modified.");
                assert.deepEqual(resources[1].description, res.resources[1].description, "Resource hasn't been modified.");
                assert.notDeepEqual(res.resources, 'undefined', "Resource(s) not returned.");
                assert.notDeepEqual(res.resources, [], "Resource(s) not returned.");

                done();
            });
        });
    });
    describe('query', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(done){
            async.parallel([
                // requestId missing
                function(callback){
                    seneca.act({role:'movements', cmd:'query'}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Missing requestId: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });},
                // requestId malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:false}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 400: " + res.status.code);
                        callback(err);
                    });}
            ],  function(err, results) {
                if(err) return done(err);
                done();
            });
        });
        it('Should return a 204 status if no matching movements are found.', function(done){
            seneca
                .act({role:'movements', cmd:'query', requestId:'test3', query:'oompa loompa'}, function(err, res){
                    if(err) return done(err);

                    // check the status code
                    assert.equal(res.status.code, 204, "Returned Status code is not 204: " + res.status.code);

                    done();
                });});
        it('Should return a 200/204 status and ignore malformed options fields and bad query characters', function(done){
            async.parallel([
                // query malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', query:0}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 204, "Bad query: Returned Status code is not 204: " + res.status.code);
                        callback(err);
                    });},
                // query has bad characters
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', query:'i.see=a}nose'}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 200, "Illegal query characters: Returned Status code is not 200: " + res.status.code);
                        callback(err);
                    });},
                // fields malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', fields:0}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 200, "Bad fields: Returned Status code is not 200: " + res.status.code);
                        callback(err);
                    });},
                // sort malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', sort:0}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 200, "Bad sort: Returned Status code is not 200: " + res.status.code);
                        callback(err);
                    });},
                // skip malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', skip:false}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 200, "Bad skip: Returned Status code is not 200: " + res.status.code);
                        callback(err);
                    });},
                // limit malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'query', requestId:'test5', limit:false}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 200, "Bad limit: Returned Status code is not 200: " + res.status.code);
                        callback(err);
                    });}
            ],  function(err, results) {
                if(err) return done(err);
                done();
            });
        });
        it('Should return a 200 status along with the movements corresponding to the provided query.', function(done){
            async.parallel([
                // empty query
                function(callback){
                    seneca
                        .act({role:'movements', cmd:'query', requestId:'test1'}, function(err, res){
                            if(err) return done(err);

                            // check the status code
                            assert.equal(res.status.code, 200, "Empty query: Returned Status code is not 200: " + JSON.stringify(res));
                            // check that all resources are returned
                            assert.equal(res.resources.length, 3, "All resources not returned");

                            callback(err);
                });},
            // populated query
            function(callback){
                seneca
                    .act({role:'movements', cmd:'query', requestId:'test1', query:'wheel'}, function(err, res){
                        if(err) return done(err);

                        // check the status code
                        assert.equal(res.status.code, 200, "Populated query: Returned Status code is not 200: " + JSON.stringify(res));
                        // check that the correct resource is returned
                        assert.equal(res.resources[0].name, 'wheel', "Resource no found.");

                        callback(err);
                });}
            ],  function(err, results) {
                if(err) return done(err);
                done();
            });
        });
    });
    describe('delete', function(){
        it('Should return a 400 status if any argument is not provided or malformed.', function(done){
            async.parallel([
                // requestId missing
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', id:resourceId[0]}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "No requestId: Returned Status code is not 404: " + res.status.code);
                        callback();
                    });},
                // requestId malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:0, id:resourceId[0]}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 404: " + res.status.code);
                        callback();
                    });},
                // id missing
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:"test"}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "No requestId: Returned Status code is not 404: " + res.status.code);
                        callback();
                    });},
                // is malformed
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:"test", id:0}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 400, "Bad requestId: Returned Status code is not 404: " + res.status.code);
                        callback();
                    });}
                ],  function(err, results) {
                        if(err) return done(err);
                        done();
                });
        });
        it('Should return a 404 status if the specified resource does not exist.', function(done){
            seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:"test"}, function(err, res){
                if(err) return done(err);
                assert.equal(res.status.code, 404, "Delete non existing: Returned Status code is not 404: " + res.status.code);
                done();
            });
        });
        it('Should return a 204 status and delete the resource whose id is specified.', function(done){
            async.parallel([
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[0]}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: \n\n" + JSON.stringify(res.error) + "\n\n");
                        callback();
                });},
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[1]}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: " + JSON.stringify(res));
                        callback();
                });},
                function(callback){
                    seneca.act({role:'movements', cmd:'delete', requestId:"test1", id:resourceId[2]}, function(err, res){
                        if(err) return callback(err);
                        assert.equal(res.status.code, 204, "Delete: Returned Status code is not 204: " + JSON.stringify(res));
                        callback();
                });}
                ],  function(err, results) {
                        if(err) return done(err);
                        done();
                });
        });
    });
});
**/

var resourceId2 = [];

describe('movements', function(){
    describe('add', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(){
            var requestIdMissing = act({role:'movements', cmd:'add'});
            var requestIdMalformed = act({role:'movements', cmd:'add', requestId:false});
            var resource1 = [{
                "description":"on every face",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceMissing = act({role:'movements', cmd:'add', requestId:'test4', resources:resource1});
            var resourceEmpty = act({role:'movements', cmd:'add', requestId:'test4', resources:[]});
            var resource2 = [{
                "name":false,
                "description":0,
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceBadType = act({role:'movements', cmd:'add', requestId:'test5', resources:resource2});
            var resource3 = [{
                "name":"foo",
                "description":"foo",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            resource3 = JSON.stringify(resource3);
            var resourceMalformed = act({role:'movements', cmd:'add', requestId:'test6', resources:resource3});
            var resource4 = [{
                "test":"test",
                "name":"foo",
                "description":0,
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceUnexpectedFields = act({role:'movements', cmd:'add', requestId:'test7', resources:resource4});

            return Promise.all([
                expect(requestIdMissing).to.eventually.have.deep.property('status.code', 400),
                expect(requestIdMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(resourceMissing).to.eventually.have.deep.property('status.code', 400),
                expect(resourceEmpty).to.eventually.have.deep.property('status.code', 400),
                expect(resourceBadType).to.eventually.have.deep.property('status.code', 400),
                expect(resourceMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(resourceUnexpectedFields).to.eventually.have.deep.property('status.code', 400)
            ]);
        });
        it('Should return a 201 status and add the provided resource(s), but ignore any id fields.', function(){
            var resource = [{
                name:"i see a nose",
                description:"on every face",
                image:"I see a nose in every place",
                organizers:[{"name":"matt"},{"name":"sharothi"}]
            }];
            var result = act({role:'movements', cmd:'add', requestId:'test1', resources:resource});
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
            var results = act({role:'movements', cmd:'add', requestId:'test2', resources:resources});

            //result.then(function(res){resourceId.push(res.resources[0].id);});
            //results.then(function(res){
            //    resourceId.push(res.resources[0].id);
            //    resourceId.push(res.resources[1].id);
            //});

            result.then(function(res) {
                resourceId2.push(res.resources[0].id);
            });
            results.then(function(res) {
                resourceId2.push(res.resources[0].id);
                resourceId2.push(res.resources[1].id);
            });

            return Promise.all([
                expect(result).to.eventually.have.deep.property('status.code', 201),
                expect(result).to.eventually.have.deep.property('resources[0].name', 'i see a nose'),
                expect(result).to.eventually.have.property('resources').to.have.length(1),
                expect(results).to.eventually.have.deep.property('status.code', 201),
                expect(results).to.eventually.have.deep.property('resources[1].name', 'brown bear brown bear'),
                expect(results).to.eventually.have.property('resources').to.have.length(2)
            ]);
        });
        it('Should return a 409 status if any of the the provided resource(s) already exist.', function(){
            var resource = [{
                name:"i see a nose",
                description:"on every face",
                image:"I see a nose in every place",
                organizers:[{"name":"matt"},{"name":"sharothi"}]
            }];
            var result = act({role:'movements', cmd:'add', requestId:'test1', resources:resource});

            return expect(result).to.eventually.have.deep.property('status.code', 409);
        });
    });
    describe('get', function() {
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
        it('Should return a 400 status if any arguments are missing or malformed.', function () {
            var requestIdMissing = act({role: 'movements', cmd: 'get', id: resourceId2[0]});
            var requestIdMalformed = act({role: 'movements',cmd: 'get',requestId: false,id: resourceId2[0]});
            var idMissing = act({role: 'movements', cmd: 'get', requestId: 'test4.2'});
            var idMalformed = act({role: 'movements', cmd: 'get', requestId: 'test4.3', id: 0});
            var fieldsMalformed = act({role: 'movements',cmd: 'get',requestId: 'test5',id: resourceId2[0],fields: 0});

            return Promise.all([
                expect(requestIdMissing).to.eventually.have.deep.property('status.code', 400),
                expect(requestIdMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(idMissing).to.eventually.have.deep.property('status.code', 400),
                expect(idMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(fieldsMalformed).to.eventually.have.deep.property('status.code', 400)
            ]);
        });
        it('Should return a 404 status if the movement does not exist.', function () {
            var result = act({role: 'movements', cmd: 'get', requestId: 'test3', id: '-test no id-'});

            return expect(result).to.eventually.have.deep.property('status.code', 404);
        });
        it('Should return a 200 status along with the movement corresponding to the provided id.', function () {
            var result = act({role: 'movements', cmd: 'get', requestId: 'test1', id: resourceId2[0]});

            return Promise.all([
                expect(result).to.eventually.have.deep.property('status.code', 200),
                expect(result).to.eventually.have.deep.property('resources.id', resourceId2[0])
            ]);
        });
    });
    describe('modify', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(){
            var requestIdMissing = act({role:'movements', cmd:'modify'});
            var requestIdMalformed = act({role:'movements', cmd:'modify', requestId:false});
            var resource1 = [{
                "description":"on every face",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceMissing = act({role:'movements', cmd:'modify', requestId:'test4', resources:resource1});
            var resourceEmpty = act({role:'movements', cmd:'modify', requestId:'test4', resources:[]});
            var resource2 = [{
                "name":false,
                "description":0,
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceBadType = act({role:'movements', cmd:'modify', requestId:'test5', resources:resource2});
            var resource3 = [{
                "name":"foo",
                "description":"foo",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            resource3 = JSON.stringify(resource3);
            var resourceMalformed = act({role:'movements', cmd:'modify', requestId:'test6', resources:resource3});
            var resource4 = [{
                "test":"test",
                "name":"foo",
                "description":0,
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var resourceUnexpectedFields = act({role:'movements', cmd:'modify', requestId:'test7', resources:resource4});

            return Promise.all([
                expect(requestIdMissing).to.eventually.have.deep.property('status.code', 400),
                expect(requestIdMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(resourceMissing).to.eventually.have.deep.property('status.code', 400),
                expect(resourceEmpty).to.eventually.have.deep.property('status.code', 400),
                expect(resourceBadType).to.eventually.have.deep.property('status.code', 400),
                expect(resourceMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(resourceUnexpectedFields).to.eventually.have.deep.property('status.code', 400)
            ]);
        });
        it('Should return a 404 status if any of the resources do not exist.', function(){
            var resource = [{
                "name":"foo",
                "description":"foo",
                "image":"I see a nose in every place",
                "organizers":[{"name":"matt"},{"name":"sharothi"}]
            }];
            var result = act({role: 'movements', cmd: 'modify', requestId: 'test', resources:resource});

            return expect(result).to.eventually.have.deep.property('status.code', 404);
        });
        it('Should return a 200 status and modify and return the target resource(s).', function(){
            var resources = [
                {
                    "id": resourceId2[1],
                    "name":"wheel",
                    "description":"round and round, round and round",
                    "image":"wheels on the bus go round and round, all around the town",
                    "organizers":[{"name":"matt"},{"name":"sharothi"}]
                },
                {
                    "id": resourceId2[2],
                    "name":"brown bear brown bear",
                    "description":"see",
                    "image":"me",
                    "organizers":[{"name":"matt"},{"name":"sharothi"}]
                }
            ];

            var result = act({role:'movements', cmd:'modify', requestId:'test', resources:resources});

            return Promise.all([
                expect(result).to.eventually.have.deep.property('status.code', 200),
                expect(result).to.eventually.have.deep.property('resources[0].name', resources[0].name),
                expect(result).to.eventually.have.deep.property('resources[0].description', resources[0].description),
                expect(result).to.eventually.have.property('resources').to.have.length(2)
            ]);
        });
    });
    describe('query', function(){
        it('Should return a 400 status if any arguments are missing or malformed.', function(){
            var requestIdMissing = act({role: 'movements', cmd: 'query'});
            var requestIdMalformed = act({role: 'movements',cmd: 'query',requestId: false});

            return Promise.all([
                expect(requestIdMissing).to.eventually.have.deep.property('status.code', 400),
                expect(requestIdMalformed).to.eventually.have.deep.property('status.code', 400)
            ]);
        });
        it('Should return a 204 status if no matching movements are found.', function(){
            var result = act({role: 'movements', cmd: 'query', requestId: 'test2', query:'oompa loompa'});

            return expect(result).to.eventually.have.deep.property('status.code', 204);
        });
        it('Should return a 200/204 status and ignore malformed options fields and bad query characters', function(){
            var queryMalformed =        act({role: 'movements', cmd: 'query', requestId:'test5', query: 0});
            var queryHasBadCharacters = act({role: 'movements', cmd: 'query', requestId:'test5', query:'i.see=a}nose'});
            var fieldsMalformed =       act({role: 'movements', cmd: 'query', requestId:'test5', fields: 0});
            var sortMalformed =         act({role: 'movements', cmd: 'query', requestId:'test5', sort: 0});
            var skipMalformed =         act({role: 'movements', cmd: 'query', requestId:'test5', skip: false});
            var limitMalformed =        act({role: 'movements', cmd: 'query', requestId:'test5', limit: false});

            return Promise.all([
                expect(queryMalformed).to.eventually.have.deep.property('status.code', 204),
                expect(queryHasBadCharacters).to.eventually.have.deep.property('status.code', 200),
                expect(fieldsMalformed).to.eventually.have.deep.property('status.code', 200),
                expect(sortMalformed).to.eventually.have.deep.property('status.code', 200),
                expect(skipMalformed).to.eventually.have.deep.property('status.code', 200),
                expect(limitMalformed).to.eventually.have.deep.property('status.code', 200)
            ]);
        });
        it('Should return a 200 status along with the movements corresponding to the provided query.', function(){
            var result1 = act({role: 'movements', cmd: 'query', requestId: 'test1'});
            var result2 = act({role: 'movements', cmd: 'query', requestId: 'test1', query:'wheel'});

            return Promise.all([
                expect(result1).to.eventually.have.deep.property('status.code', 200),
                expect(result1).to.eventually.have.property('resources').to.have.length(3),
                expect(result2).to.eventually.have.deep.property('status.code', 200),
                expect(result2).to.eventually.have.property('resources').to.have.length(1),
                expect(result2).to.eventually.have.deep.property('resources[0].name', 'wheel')
            ]);
        });
    });
    describe('delete', function(){
        it('Should return a 400 status if any argument is not provided or malformed.', function(){
            var requestIdMissing = act({role: 'movements', cmd: 'delete', id: resourceId2[0]});
            var requestIdMalformed = act({role: 'movements',cmd: 'delete',requestId: false,id: resourceId2[0]});
            var idMissing = act({role: 'movements', cmd: 'delete', requestId: 'test4.2'});
            var idMalformed = act({role: 'movements', cmd: 'delete', requestId: 'test4.3', id: 0});

            return Promise.all([
                expect(requestIdMissing).to.eventually.have.deep.property('status.code', 400),
                expect(requestIdMalformed).to.eventually.have.deep.property('status.code', 400),
                expect(idMissing).to.eventually.have.deep.property('status.code', 400),
                expect(idMalformed).to.eventually.have.deep.property('status.code', 400),
            ]);
        });
        it('Should return a 404 status if the specified resource does not exist.', function(){
            var result = act({role: 'movements', cmd: 'delete', requestId: 'test2', id:'test'});

            return expect(result).to.eventually.have.deep.property('status.code', 404);
        });
        it('Should return a 204 status and delete the resource whose id is specified.', function(){
            var result1 = act({role: 'movements', cmd: 'delete', requestId: 'test1', id:resourceId2[0]});
            var result2 = act({role: 'movements', cmd: 'delete', requestId: 'test2', id:resourceId2[1]});
            var result3 = act({role: 'movements', cmd: 'delete', requestId: 'test3', id:resourceId2[2]});

            return Promise.all([
                expect(result1).to.eventually.have.deep.property('status.code', 204),
                expect(result2).to.eventually.have.deep.property('status.code', 204),
                expect(result3).to.eventually.have.deep.property('status.code', 204)
            ]);
        });
    });
});
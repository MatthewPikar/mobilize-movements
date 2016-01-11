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

var asPromised = require('chai-as-promised'),
    chai = require('chai')
        .use(asPromised),
    expect = chai.expect,
    async = require('async'),
    seneca = require('seneca')()
        .use('resource-service', {
            resourceName: 'movements',
            resourceFormat: {
                required$: ['name'],
                only$: ['id', 'name', 'description', 'image', 'organizers'],
                name: 'string$',
                description: 'string$',
                image: 'string$'
            }
        }),
    Promise = require('bluebird'),
    act = Promise.promisify(seneca.act, {context:seneca})
    ;

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
            var queryMalformed =        act({role: 'movements', cmd: 'query', requestId:'test5', query: {name:0}});
            var queryHasBadCharacters = act({role: 'movements', cmd: 'query', requestId:'test5', query: {name:'i.see=a}nose'}});
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
            var result2 = act({role: 'movements', cmd: 'query', requestId: 'test1', query:{name:'wheel'}});

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
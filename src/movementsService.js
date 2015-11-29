/**
 * Created by mattpiekarczyk on 11/4/15.
 */
"use strict";

require('seneca')()
    .use('movements')
    .listen({type:'tcp', port:'30010', pin:'role:movements'})
//    .listen({port:8001, type:'http', pin:'role:movements'})
;
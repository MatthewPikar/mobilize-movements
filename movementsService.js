/**
 * Created by mattpiekarczyk on 11/4/15.
 */
"use strict";

require('seneca')()
    .use('movements')
    .listen({type:'tcp', port:'30010', pin:'role:movements'})
;
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var despotify = require("./despotify_nicer");

var handle = {}
handle["/"] = requestHandlers.index;
server.start(router.route, handle);

var http = require("http");
var urlParse = require("url");
var template = require("./template");

function start(route, handle) {
  function onRequest(request, response) {
    var url =  urlParse.parse(request.url,true);
    var pathname = url.pathname;
    console.log("Request for " + pathname + " received.");
    template.clearCache(); //TODO: Remove
    route(handle, pathname, response, request, url.query);
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;

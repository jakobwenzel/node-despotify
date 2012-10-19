var despotify = require("./libdespotify");
function callbackWrapper(callback) {
	return despotify.make_callback(function(session,signal,signal_data,callback_data) {
		if (signal==1) {
			return callback(session,signal,signal_data.track.deref());
		} else if (signal==2) {
			return callback(session,signal,signal_data.time.deref());
		} else {
			return callback(session,signal,signal_data,callback_data)
		}
	});
}
function init_client(callback, high_bitrate, use_cache) {
	var session = despotify.init_client(callbackWrapper(callback), null, high_bitrate, use_cache);
	return session;
}
exports.init = despotify.init
exports.init_client = init_client

var despotify = require("./libdespotify");
var ref = require("ref");
function callbackWrapper(callback) {
	return despotify.make_callback(function(session,signal,signal_data,callback_data) {
		if (signal==1) {
			return callback(session,signal,toObject(signal_data.track.deref()));
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
function init() {
	console.log("init")
	var a = despotify.init();
	console.log("init over");
	return a;
}

function nextToArray(p) {
	var a = new Array();
	while (p!=null) {
		a.push(p);
		p=p.next;
	}
	return a;
}


function formatTime(t) {
	var s = Math.round(t/1000);
	var h = Math.floor(s / 3600);
	var m = Math.floor(s / 60) % 60;
	s = s % 60;
	if (s<10) s = "0"+s;
	if (h>0) {
		if (m<10) m = "0"+m;
		return h+":"+m+":"+s;
	}
	return m+":"+s;;
}

function toObject(ref,pointer) {
	if (ref === null) return ref;
	//is it a pointer?
	if (ref.deref != undefined) {
		//Points to null?
		if (ref.isNull()) return null;
		//Convert derefed object otherwise
		return toObject(ref.deref(),ref);
	}
	if (ref.constructor != undefined) {
		//is it a struct?
		if (ref.constructor.fields != undefined) {
			//Convert each key. Similar to ref_struct.toObject
			var obj = {};
	  		Object.keys(ref.constructor.fields).forEach(function (k) {
	    			var v = toObject(ref[k],undefined);
	    			//Convert to array if appropriate
	    			if ((k!="next") && (v instanceof Object) && (typeof v.next != "undefined")) 
	    				obj[k]=nextToArray(v);
	    			else {
	    				obj[k] = v;
	    				if (k=="length") 
		    				//Add time formatted in h:m:s
		    				obj["time"] = formatTime(v);
	    			}
	  		}, this);
	  		//Save reference to original object in case it needs 
	  		//to be passed back to despotify. if a pointer was given,
	  		//use it, otherwise create a new one
	  		if (pointer!=undefined)
		  		raw = pointer;
		  	else
		  		raw = ref.ref();
		  	obj.__proto__ = {'__raw': raw}
	  		return obj;
		}
		//is it an array?
		if (ref.constructor.size != undefined) {
			//console.log("array");
			//convert to string if array of char
			if (ref.constructor.type.name=='char') {
			//	console.log("array of char");
				return decodeStr(ref);
			} //else console.log("some other array");
		}
	}
	return ref;
}

function concatInfo(data,infoExtract, separator) {
	separator = (typeof separator === "undefined") ? ", " : separator;
	var res = "";
	var d = data;
	while (!d.isNull()) {
		if (d!=data)
			res = res+separator;
		var deref = d.deref();
		res = res+infoExtract(deref);
		d = deref.next;
	}
	return res;
}

//Rewrite arguments for despotify function. Get the encapsulated raw pointer 
//for structs out of the object.
function rewriteArgs(args) {
	var newArgs = new Array(args.length)	

	for (var i=0;i<args.length;i++) {
		if ((args[i] instanceof Object)&&(args[i].__raw!=undefined)) {
			newArgs[i]=args[i].__raw;
		} else newArgs[i]=args[i];
	}
	return newArgs;
}
//Rewrite arguments for function and convert result to usable object
function resToObject(f,resultToArray) {
	resultToArray = (typeof resultToArray == "undefined")?false:resultToArray;
	//Regular call
	res = function(args) {			
		//Rewrite args
		var res = f.apply(this,rewriteArgs(arguments));
		//And result
		if (resultToArray)
			return nextToArray(toObject(res));
		return toObject(res);
	}
	//Async call
	res.async = function(args) {
		//Rewrite args
		var a = rewriteArgs(arguments);
		//Wrap callback
		var cb = a[a.length-1];
		a[a.length-1]=function(err,res) {
			if (resultToArray)
				cb(err,nextToArray(toObject(res)));
			else
				cb(err,toObject(res));
		};
		f.async.apply(this,a);
	}
	return res;
}

//Convert ffi's buffer stuff to nice javascript objects
function decodeStr(arr) {
	var b = ref.reinterpretUntilZeros(arr.buffer,1);
	return b.toString('utf8');
}

exports.init = init
exports.init_client = init_client

exports.session = despotify.session;
exports.session_ptr = despotify.session_ptr;
exports.void_ptr = despotify.void_ptr;
exports.artist = despotify.artist;
exports.artist_ptr = despotify.artist_ptr;
exports.track = despotify.track;
exports.track_ptr = despotify.track_ptr;
exports.album_browse = despotify.album_browse;
exports.album_browse_ptr = despotify.album_browse_ptr;
exports.artist_browse = despotify.artist_browse;
exports.artist_browse_ptr = despotify.artist_browse_ptr;
exports.album = despotify.album;
exports.album_ptr = despotify.album_ptr;
exports.playlist = despotify.playlist;
exports.playlist_ptr = despotify.playlist_ptr;
exports.search_result = despotify.search_result;
exports.search_result_ptr = despotify.search_result_ptr;
exports.link = despotify.link;
exports.link_ptr = despotify.link_ptr;
exports.pcm_data = despotify.pcm_data;
exports.pcm_data_ptr = despotify.pcm_data_ptr;

exports.cleanup = despotify.cleanup;
exports.authenticate = despotify.authenticate;
exports.get_artist = resToObject(despotify.get_artist);
exports.exit = despotify.exit;
exports.set_buffer_size = despotify.set_buffer_size;
exports.set_watermark = despotify.set_watermark;
exports.free = despotify.free;
exports.get_error = despotify.get_error;
exports.get_album = resToObject(despotify.get_album);
exports.get_track = resToObject(despotify.get_track);
exports.get_image = despotify.get_image; //TODO
exports.free_artist_browse = resToObject(despotify.free_artist_browse);
exports.free_album_browse = resToObject(despotify.free_album_browse);
exports.free_track = resToObject(despotify.free_track);
exports.search = resToObject(despotify.search);
exports.search_more = resToObject(despotify.search_more);
exports.free_search = resToObject(despotify.free_search);
exports.get_playlist = resToObject(despotify.get_playlist);
exports.get_stored_playlists = resToObject(despotify.get_stored_playlists,true);
exports.rename_playlist = resToObject(despotify.rename_playlist);
exports.set_playlist_collaboration = resToObject(despotify.set_playlist_collaboration);
exports.free_playlist = resToObject(despotify.free_playlist);
exports.play = resToObject(despotify.play);
exports.next = despotify.next;
exports.stop = despotify.stop;
exports.get_current_track = resToObject(despotify.get_current_track);
exports.get_pcm = despotify.get_pcm; //TODO
exports.link_from_uri = resToObject(despotify.link_from_uri);
exports.link_get_album = resToObject(despotify.link_get_album);
exports.link_get_artist = resToObject(despotify.link_get_artist);
exports.link_get_playlist = resToObject(despotify.link_get_playlist);
exports.link_get_search = resToObject(despotify.link_get_search);
exports.link_get_track = resToObject(despotify.link_get_track);
exports.free_link = resToObject(despotify.free_link);
exports.album_to_uri = resToObject(despotify.album_to_uri);
exports.artist_to_uri = resToObject(despotify.artist_to_uri);
exports.playlist_to_uri = resToObject(despotify.playlist_to_uri);
exports.search_to_uri = resToObject(despotify.search_to_uri);
exports.track_to_uri = resToObject(despotify.track_to_uri);
exports.id2uri = despotify.id2uri; //TODO
exports.uri2id = despotify.uri2id; //TODO
exports.decodeStr = decodeStr;

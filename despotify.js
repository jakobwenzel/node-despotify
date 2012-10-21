var despotify = require("./libdespotify");
var login = require("./login");
var ref = require('ref');
var ffi = require('ffi');
var despotifyN = require("./despotify_nicer");

function callback(session_ptr, signal, signal_data) {
	if (signal==1) { //It's track info
		dumpTrackInfo(signal_data.track.deref());
	} else if (signal==2) { //It's the time
		var time = signal_data;
		console.log("time "+time);
	} else console.log("callback! "+signal);
}
decodeStr = despotifyN.decodeStr

function dumpTrackInfo(track) {
	console.log("metadata:       "+track.has_meta_data);
	console.log("playable:       "+track.playable);
	console.log("geo_restricted: "+track.geo_restricted);
	console.log("track_id:       "+decodeStr(track.track_id));
	console.log("file_id:        "+decodeStr(track.file_id));
	console.log("bitrate:        "+track.file_bitrate);
	console.log("album_id:       "+decodeStr(track.album_id));
	console.log("cover_id:       "+decodeStr(track.cover_id));
	console.log("key:            "+track.key);
	console.log("allowed:        "+track.allowed);
	console.log("forbidden:      "+track.forbidden);
	console.log("title:          "+decodeStr(track.title));
	console.log("album:          "+decodeStr(track.album));
	console.log("length:         "+track.length);
	console.log("tracknumber:    "+track.tracknumber);
	console.log("year:           "+track.year);
	console.log("popularity:     "+track.popularity);
}

function dumpArtistInfo(artist) {
	console.log("name:           "+decodeStr(artist.name));
	console.log("id:             "+decodeStr(artist.id));
	console.log("portrait_id:    "+decodeStr(artist.portrait_id));
	console.log("popularity:     "+artist.popularity);
}
function dumpArtistBrowseInfo(artist) {
	console.log("name:           "+decodeStr(artist.name));
	console.log("id:             "+decodeStr(artist.id));
	console.log("text:           "+artist.text);
	console.log("portrait_id:    "+decodeStr(artist.portrait_id));
	console.log("genres:         "+decodeStr(artist.genres));
	console.log("years_active:   "+decodeStr(artist.years_active));
	console.log("popularity:     "+artist.popularity);
	console.log("num_albums:     "+artist.num_albums);
}
function dumpAlbumBrowseInfo(album) {
	console.log("name:           "+decodeStr(album.name));
	console.log("id:             "+decodeStr(album.id));
	console.log("num_tracks:     "+album.num_tracks);
	console.log("year:           "+album.year);
	console.log("cover_id:       "+decodeStr(album.cover_id));
	console.log("popularity:     "+album.popularity);
}
function dumpAlbumInfo(album) {
	console.log("name:           "+decodeStr(album.name));
	console.log("id:             "+decodeStr(album.id));
	console.log("artist:         "+decodeStr(album.artist));
	console.log("artist_id:      "+decodeStr(album.artist_id));
	console.log("cover_id:       "+decodeStr(album.cover_id));
	console.log("popularity:     "+album.popularity);
}
function returnName(a){return decodeStr(a.name,false);}
function testSearch() {
	var resultPtr = despotify.search(session,"Good time",100);
	console.log("query:          "+decodeStr(resultPtr.deref().query));
	console.log("suggestion:     "+decodeStr(resultPtr.deref().suggestion));
	var track = resultPtr.deref().tracks;
	setTimeout(function(){ 

	console.log(despotify.play(session,track,false));
	var total = 0;
	//Spotify does not start the song if we are too fast
	setInterval(function() {
		var pcm = ref.alloc(despotify.pcm_data);
		console.log("getting pcm");
		var b = despotify.get_pcm(session,pcm);
	
		console.log("return code: "+b);
		total+=pcm.deref().len;
		console.log("content len: "+pcm.deref().len);
		console.log("total len  : "+total);
		console.log("");
		}, 1);
 }, 5);
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
console.log("init result:    "+despotifyN.init());
var session = despotifyN.init_client(callback, true, true);
console.log("login result:   "+despotify.authenticate(session,login.username,login.password));
testSearch();
//Do something so the program does not exit immediately
var http = require('http');
http.createServer().listen(1337, '127.0.0.1');

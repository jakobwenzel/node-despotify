
var login = require("./login");
var ref = require('ref');
var ffi = require('ffi');
var despotify = require("./despotify_nicer");

function callback(session_ptr, signal, signal_data) {
	if (signal==1) { //It's track info
		dumpTrackInfo(signal_data);
	} else if (signal==2) { //It's the time
		console.log("time "+signal_data);
	} else console.log("callback! "+signal);
	throw new Error('');
}
function dumpTrackInfo(track) {
	console.log("metadata:       "+track.has_meta_data);
	console.log("playable:       "+track.playable);
	console.log("geo_restricted: "+track.geo_restricted);
	console.log("track_id:       "+track.track_id);
	console.log("file_id:        "+track.file_id);
	console.log("bitrate:        "+track.file_bitrate);
	console.log("album_id:       "+track.album_id);
	console.log("cover_id:       "+track.cover_id);
	console.log("key:            "+track.key);
	console.log("allowed:        "+track.allowed);
	console.log("forbidden:      "+track.forbidden);
	console.log("title:          "+track.title);
	console.log("album:          "+track.album);
	console.log("length:         "+track.length);
	console.log("tracknumber:    "+track.tracknumber);
	console.log("year:           "+track.year);
	console.log("popularity:     "+track.popularity);
}

function dumpArtistInfo(artist) {
	console.log("name:           "+artist.name);
	console.log("id:             "+artist.id);
	console.log("portrait_id:    "+artist.portrait_id);
	console.log("popularity:     "+artist.popularity);
}
function dumpArtistBrowseInfo(artist) {
	console.log("name:           "+artist.name);
	console.log("id:             "+artist.id);
	console.log("text:           "+artist.text);
	console.log("portrait_id:    "+artist.portrait_id);
	console.log("genres:         "+artist.genres);
	console.log("years_active:   "+artist.years_active);
	console.log("popularity:     "+artist.popularity);
	console.log("num_albums:     "+artist.num_albums);
}
function dumpAlbumBrowseInfo(album) {
	console.log("name:           "+album.name);
	console.log("id:             "+album.id);
	console.log("num_tracks:     "+album.num_tracks);
	console.log("year:           "+album.year);
	console.log("cover_id:       "+album.cover_id);
	console.log("popularity:     "+album.popularity);
}
function dumpAlbumInfo(album) {
	console.log("name:           "+album.name);
	console.log("id:             "+album.id);
	console.log("artist:         "+album.artist);
	console.log("artist_id:      "+album.artist_id);
	console.log("cover_id:       "+album.cover_id);
	console.log("popularity:     "+album.popularity);
}

function testSearch() {
	var result = despotify.search(session,"Good time",100);
	console.log("query:          "+result.query);
	console.log("suggestion:     "+result.suggestion);
	var track = result.tracks;
	setTimeout(function(){ 

	console.log(despotify.play(session,track,false));
	var total = 0;
	//Spotify does not start the song if we are too fast
	setInterval(function() {
	
		var pcm = ref.alloc(despotify.pcm_data);
		//console.log("getting pcm");
		var b = despotify.get_pcm(session,pcm);
	
		//console.log("return code: "+b);
		total+=pcm.deref().len;
		/*console.log("content len: "+pcm.deref().len);
		console.log("total len  : "+total);
		console.log("");*/
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
console.log("init result:    "+despotify.init());
var session = despotify.init_client(callback, true, true);
console.log("login result:   "+despotify.authenticate(session,login.username,login.password));
testSearch();
//Do something so the program does not exit immediately
var http = require('http');
http.createServer().listen(1337, '127.0.0.1');

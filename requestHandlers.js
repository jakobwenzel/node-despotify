var querystring = require("querystring"),
	template = require("./template"),
	despotify = require("./despotify_nicer"),
	login = require("./login");
	
	
function callback(session_ptr, signal, signal_data) {
	 console.log("callback! "+signal);
}

console.log("init result:    "+despotify.init());
var session = despotify.init_client(callback, true, true);
console.log("created session");
console.log("login result:   "+despotify.authenticate(session,login.username,login.password));

var playlists = null;

despotify.get_stored_playlists.async(session, function(err,pl){
	playlists = pl;
	console.log("playlists finished loading");
});

function listPlaylists() {
	if (playlists == null) {
		return [{
			id: '',
			name: 'Playlists loading...'
		}];
	}
	return playlists;
}

function mainTemplate(response,headerCode,title,content) {
	var body = template.replace('main',{
		title: title,
		content: content,
		playlists: listPlaylists()
	});
	response.writeHead(headerCode, {"Content-Type": "text/html"});
	response.write(body);
	response.end();
}



function findPlaylist(id) {
	//TODO: Make it work for all playlists, not only the user's stored ones.
	for (var i=0;i<playlists.length;i++){
		if (playlists[i].playlist_id==id)
			return playlists[i];
	}
	return null;
}

function playlist(response,request,id) {
	//Getting playlist
	var found = false;
	if (id !== undefined) {
		var playlist = findPlaylist(id);
		found = playlist != null;
	}
	if (!found) {
		mainTemplate(response,404,'Playlist not found','Playlist '+id+' not found');
	} else {
		var body = template.replace('playlist',playlist);
		mainTemplate(response,200,'Playlist '+playlist.name,body);
	}
	
	
}

function search(response,request,search) {
	despotify.search.async(session,search,100,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Search','Searching failed');
		} else {
			var body = template.replace('search',res);
			mainTemplate(response,200,'Search for '+search,body);
		}
	});
}

function album(response,request,id) {
	despotify.get_album.async(session,id,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Album','Loading Album failed');
		} else {
			var body = template.replace('album',res);
			mainTemplate(response,200,'Album '+res.name,body);
		}	
	});
}

function artist(response,request,id) {
	despotify.get_artist.async(session,id,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Artist','Loading Artist failed');
		} else {
			var body = template.replace('artist',res);
			mainTemplate(response,200,'Artist '+res.name,body);
		}	
	});
}

function index(response,request,q) {
	if (q.search!=undefined) search(response,request,q.search);
	else if (q.playlist!==undefined) playlist(response,request,q.playlist);
	else if (q.album!==undefined) album(response,request,q.album);
	else if (q.artist!==undefined) artist(response,request,q.artist);
	else mainTemplate(response,200,'Index','');
}

exports.index = index;

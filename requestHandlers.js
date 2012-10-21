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
//playlists = despotify.get_stored_playlists(session);

function listPlaylists() {
	if (playlists == null) {
		return [{
			id: '',
			name: 'Playlists loading...'
		}];
	}
	var l = [];
	var p = playlists;
	while (p!=null) {
		l.push({
			id: p.playlist_id,
			name: p.name
		});
		p=p.next;
	}
	return l;
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
	var p = playlists;
	while (p!=null) {
		if (p.playlist_id==id)
			return p;
		p=p.next;
	}
	return null;
}

function getArtists(track) {
	var a = track.artist;
	var res = [];
	while (a!=null) {
		res.push({
			artist_id: a.id,
			name: a.name
		});
		
		a=a.next;
	}
	return res;
}

function listTracks(tracks,useTemplate) {
	useTemplate = (useTemplate===undefined)?true:useTemplate;
	var t = tracks;
	var l = [];
	var even=true;
	while (t!=null) {
		even = !even;
		
		l.push({
			id: t.track_id,
			title: t.title,
			album: t.album,
			album_id: t.album_id,
			artist: getArtists(t),
			stripe: even?'even':'odd',
			number: t.tracknumber
		});
		t = t.next;
	}
	if (useTemplate)
		return template.loop('track',l);
	else return l;
}


function listAlbums(artist) {
	var a = artist.albums;
	var l = [];
	while (a!=null) {
		l.push({
			id: a.id,
			name: a.name,
			tracks: listTracks(a.tracks,false)
		});
		a = a.next;
	}
	console.log(l);
	var arg = {
		loop: l,
		name: artist.name,
		num_albums: artist.num_albums
	};
	return template.replace('album',arg);
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
		tracks = listTracks(playlist.tracks);
		mainTemplate(response,200,'Playlist '+playlist.name,tracks);
	}
	
	
}

function search(response,request,search) {
	despotify.search.async(session,search,100,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Search','Searching failed');
		} else {
			tracks = listTracks(res.tracks);
			mainTemplate(response,200,'Search for '+search,tracks);
		}
	});
}

function album(response,request,id) {
	despotify.get_album.async(session,id,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Album','Loading Album failed');
		} else {
			tracks = listTracks(res.tracks);
			mainTemplate(response,200,'Album '+res.name,tracks);
		}	
	});
}

function artist(response,request,id) {
	despotify.get_artist.async(session,id,function(err,res) {
		if (res==null) {
			mainTemplate(response,500,'Artist','Loading Artist failed');
		} else {
			albums = listAlbums(res);
			mainTemplate(response,200,'Artist '+res.name,albums);
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

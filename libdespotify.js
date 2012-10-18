var ref = require('ref');
var StructType = require('ref-struct')
var ArrayType = require('ref-array')
var ffi = require('ffi');
var UnionType = require('ref-union')


var session = ref.types.void;
var session_ptr = ref.refType(session);
var void_ptr = ref.refType(ref.types.void);



var char = ref.types.char
var char4096 = ArrayType(char, 4096);
var char256  = ArrayType(char, 256 );
var char41   = ArrayType(char, 41  );
var char35   = ArrayType(char, 35  );
var char33   = ArrayType(char, 33  );

var char_ptr = ref.refType(char);
var char_ptrArr = ArrayType(char_ptr);

var artist = StructType({
   'name':char256,
   'id': char33,
   'portrait_id': char41,
   'popularity': 'float'
});
var artist_ptr = ref.refType(artist);
artist.defineProperty('next',artist_ptr);

var track = StructType({
  'has_meta_data': 'bool',
  'playable': 'bool',
  'geo_restricted': 'bool',
  'track_id': char33,
  'file_id': char41, 
  'file_bitrate': 'uint',
  'album_id':char33,
  'cover_id':char41,
  'key':'string',
  'allowed':'string',
  'forbidden':'string',
  'title':char256,
  'artist':artist_ptr,
  'album':char256,
  'length':'int',
  'tracknumber':'int',
  'year':'int',
  'popularity':'float'
});
var track_ptr = ref.refType(track);
track.defineProperty('next',track_ptr);


var album_browse = StructType({
    'name': char256,
    'id': char33,
    'num_tracks': 'int',
    'tracks': track_ptr,
    'year':'int',
    'cover_id':char41,
    'popularity':'float',
});
var album_browse_ptr = ref.refType(album_browse);
album_browse.defineProperty('next',album_browse_ptr);
	  
var artist_browse = StructType({
  'name': char256,
  'id': char33,
  'text': 'string',
  'portrait_id': char41,
  'genres': char256,
  'years_active':char256,
  'popularity':'float',
  'num_albums':'int',
  'album_browse':album_browse_ptr
});
var artist_browse_ptr = ref.refType(artist_browse);



var album = StructType({
    'name':char256,
    'id':char33,
    'artist':char256,
    'artist_id':char33,
    'cover_id':char41,
    'popularity':'float',
});
var album_ptr = ref.refType(album);
album.defineProperty('next',album_ptr);


var playlist = StructType({
    'name': char256,
    'author': char256,
    'playlist_id': char35,
    'is_collaborative':'bool',
    'num_tracks': 'int',
    'revision':'uint',
    'checksum':'uint',
    'tracks':track_ptr
});
var playlist_ptr = ref.refType(playlist);
playlist.defineProperty('next',playlist_ptr);


var search_result = StructType({
  'query': char256,
  'suggestion': char256,
  'total_artists':'int',
  'total_albums':'int',
  'total_tracks':'int',
  'artists': artist_ptr,
  'albums':album_ptr,
  'tracks':track_ptr,
  'playlist':playlist_ptr
});
var search_result_ptr = ref.refType(search_result);

var link = StructType({
    'uri': 'string',
    'arg': 'string',
    'type': 'byte'
});
var link_ptr = ref.refType(link);

var pcm_data = StructType({
    'samplerate': 'int',
    'channels': 'int',
    'len': 'int',
    'buf': char4096
});
var pcm_data_ptr = ref.refType(pcm_data);



var signal_data =  UnionType({
  time: ref.refType(ref.types.double),
  track: track_ptr
});



//TODO: Save the reference to more than one returned callback
var cb;
process.on('exit', function() {
	//Save callback pointer
	 var x = cb
});
function make_callback(callback) {
	cb = ffi.Callback('void', [ session_ptr, 'int',  signal_data, void_ptr], callback);
	return cb;
}

var libdespotify = ffi.Library('libdespotify', {
	'despotify_init':[ 'bool', [ ] ],
	'despotify_cleanup':[ 'bool', [ ] ],
	'despotify_init_client': [ session_ptr, [ void_ptr, void_ptr, 'bool', 'bool' ] ],
	'despotify_authenticate': [ 'bool', [ session_ptr, 'string', 'string'] ],
	'despotify_get_artist': [ artist_browse_ptr, [session_ptr, 'string'] ],

	'despotify_exit': [ 'void', [ session_ptr ] ],
	'despotify_set_buffer_size': [ 'void', [ session_ptr, 'int' ] ],
	'despotify_set_watermark': [ 'void', [ session_ptr, 'int' ] ],
	'despotify_free': [ 'void', [ session_ptr, 'bool' ] ],
	'despotify_get_error': [ 'string', [ session_ptr ] ],

	'despotify_get_album': [ album_browse_ptr, [ session_ptr, 'string' ] ],
	//TODO: Make get_tracks work!
	//'despotify_get_tracks': [ track_ptr, [ session_ptr, char_ptrArr, 'int' ] ],
	'despotify_get_track': [ track_ptr, [ session_ptr, 'string' ] ],
	'despotify_get_image': [ void_ptr, [ session_ptr, 'string', 'int *' ] ],

	'despotify_free_artist_browse': [ 'void', [ artist_browse_ptr ] ],
	'despotify_free_album_browse': [ 'void', [ album_browse_ptr ] ],
	'despotify_free_track': [ 'void', [ track_ptr ] ],

	'despotify_search': [search_result_ptr, [ session_ptr, 'string', 'int'] ],
	'despotify_search_more': [ search_result_ptr, [ session_ptr, search_result_ptr, 'int', 'int' ] ],
	'despotify_free_search': [ 'void', [ search_result_ptr ] ],


	'despotify_get_playlist': [ playlist_ptr, [ session_ptr, 'string', 'bool' ] ],
	'despotify_get_stored_playlists': [ playlist_ptr, [ session_ptr ] ],
	'despotify_rename_playlist': [ 'bool', [ session_ptr, playlist_ptr, 'string' ] ],
	'despotify_set_playlist_collaboration': [ 'bool', [ session_ptr, playlist_ptr, 'bool' ] ],
	'despotify_free_playlist': [ 'void', [ playlist_ptr ] ],
	
	'despotify_play': [ 'bool', [ session_ptr, track_ptr, 'bool' ] ],
	'despotify_next': [ 'bool', [ session_ptr ] ],
	'despotify_stop': [ 'bool', [ session_ptr ] ],

	'despotify_get_current_track': [ track_ptr, [ session_ptr ] ],

	'despotify_get_pcm': [ 'int', [ session_ptr, pcm_data_ptr ] ],


	'despotify_link_from_uri': [ link_ptr, [ 'string' ] ],

	'despotify_link_get_album': [ album_browse_ptr, [ session_ptr, link_ptr ] ],
	'despotify_link_get_artist': [ artist_browse_ptr, [ session_ptr, link_ptr ] ],
	'despotify_link_get_playlist': [ playlist_ptr, [ session_ptr, link_ptr ] ],
	'despotify_link_get_search': [ search_result_ptr, [ session_ptr, link_ptr ] ],
	'despotify_link_get_track': [ track_ptr, [ session_ptr, link_ptr ] ],

	'despotify_free_link': [ 'void', [ link_ptr ] ],

	'despotify_album_to_uri': [ 'string', [ album_browse_ptr, 'string' ] ],
	'despotify_artist_to_uri': [ 'string', [ artist_browse_ptr, 'string' ] ],
	'despotify_playlist_to_uri': [ 'string', [ playlist_ptr, 'string' ] ],
	'despotify_search_to_uri': [ 'string', [ search_result_ptr, 'string' ] ],
	'despotify_track_to_uri': [ 'string', [ track_ptr, 'string' ] ],

	'despotify_id2uri': [ 'void', [ 'string', 'string' ] ],
	'despotify_uri2id': [ 'void', [ 'string', 'string' ] ]

});

exports.session = session;
exports.session_ptr = session_ptr;
exports.void_ptr = void_ptr;
exports.artist = artist;
exports.artist_ptr = artist_ptr;
exports.track = track;
exports.track_ptr = track_ptr;
exports.album_browse = album_browse;
exports.album_browse_ptr = album_browse_ptr;
exports.artist_browse = artist_browse;
exports.artist_browse_ptr = artist_browse_ptr;
exports.album = album;
exports.album_ptr = album_ptr;
exports.playlist = playlist;
exports.playlist_ptr = playlist_ptr;
exports.search_result = search_result;
exports.search_result_ptr = search_result_ptr;
exports.link = link;
exports.link_ptr = link_ptr;
exports.pcm_data = pcm_data;
exports.pcm_data_ptr = pcm_data_ptr;

exports.init = libdespotify.despotify_init;
exports.cleanup = libdespotify.despotify_cleanup;
exports.init_client = libdespotify.despotify_init_client;
exports.authenticate = libdespotify.despotify_authenticate;
exports.get_artist = libdespotify.despotify_get_artist;
exports.exit = libdespotify.despotify_exit;
exports.set_buffer_size = libdespotify.despotify_set_buffer_size;
exports.set_watermark = libdespotify.despotify_set_watermark;
exports.free = libdespotify.despotify_free;
exports.get_error = libdespotify.despotify_get_error;
exports.get_album = libdespotify.despotify_get_album;
exports.get_track = libdespotify.despotify_get_track;
exports.get_image = libdespotify.despotify_get_image;
exports.free_artist_browse = libdespotify.despotify_free_artist_browse;
exports.free_album_browse = libdespotify.despotify_free_album_browse;
exports.free_track = libdespotify.despotify_free_track;
exports.search = libdespotify.despotify_search;
exports.search_more = libdespotify.despotify_search_more;
exports.free_search = libdespotify.despotify_free_search;
exports.get_playlist = libdespotify.despotify_get_playlist;
exports.get_stored_playlists = libdespotify.despotify_get_stored_playlists;
exports.rename_playlist = libdespotify.despotify_rename_playlist;
exports.set_playlist_collaboration = libdespotify.despotify_set_playlist_collaboration;
exports.free_playlist = libdespotify.despotify_free_playlist;
exports.play = libdespotify.despotify_play;
exports.next = libdespotify.despotify_next;
exports.stop = libdespotify.despotify_stop;
exports.get_current_track = libdespotify.despotify_get_current_track;
exports.get_pcm = libdespotify.despotify_get_pcm;
exports.link_from_uri = libdespotify.despotify_link_from_uri;
exports.link_get_album = libdespotify.despotify_link_get_album;
exports.link_get_artist = libdespotify.despotify_link_get_artist;
exports.link_get_playlist = libdespotify.despotify_link_get_playlist;
exports.link_get_search = libdespotify.despotify_link_get_search;
exports.link_get_track = libdespotify.despotify_link_get_track;
exports.free_link = libdespotify.despotify_free_link;
exports.album_to_uri = libdespotify.despotify_album_to_uri;
exports.artist_to_uri = libdespotify.despotify_artist_to_uri;
exports.playlist_to_uri = libdespotify.despotify_playlist_to_uri;
exports.search_to_uri = libdespotify.despotify_search_to_uri;
exports.track_to_uri = libdespotify.despotify_track_to_uri;
exports.id2uri = libdespotify.despotify_id2uri;
exports.uri2id = libdespotify.despotify_uri2id;

exports.make_callback = make_callback;

exports.signal_data = signal_data

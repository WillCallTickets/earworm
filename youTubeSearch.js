////////////////////////////////////////////
//  youTubeSearch.js
//
//  contains class/function definitions for
//  the videoItem object as well as a wrapper
//  for the youTubeSearch and youTubePlayer Apis
////////////////////////////////////////////

// The client ID is obtained from the {{ Google Cloud Console }}
// at {{ https://cloud.google.com/console }}.
// If you run this code from a server other than http://localhost,
// you need to register your own client ID.
var OAUTH2_CLIENT_ID = '613492891042-p09aunkiilemd3ak3j773fskutv1prif.apps.googleusercontent.com';
var OAUTH2_SCOPES = ['https://www.googleapis.com/auth/youtube'];
var API_BROWSER_KEY = 'AIzaSyCIVeAqw5Sqiz5dt9GrfLacBt-p3xLlPTA'


//////////////////////////////////////////////////
// Video Item Object
//////////////////////////////////////////////////
var ytVideo = function (idx, name, duration, thumbnail){
    this.ytVideoId = idx || '';
    this.name = name || '';
    this.duration = duration || '';
    this.thumbnail = thumbnail || '';
}
ytVideo.prototype.durationInMs = function() {
    var ms = moment.duration(this.duration);
    var secs = Math.ceil(ms/1000);
    return secs;
}
ytVideo.prototype.endMinus30Seconds = function() {
    var secs = this.durationInMs();
    var prior30 = (secs > 30) ? secs - 30 : 0;
    return prior30;
}


//////////////////////////////////////////////////
// The Player Object
//////////////////////////////////////////////////
var YtPlayer = function(_$container, _width, _height) {

    this.$container = _$container || '';
    this.width = _width || '300';
    this.height = _height || '100';

    this.PLAYER_ID = 'yt_player';
    this.PLAYLIST_ID = 'yt_playlist';
    this.PLAYER_TEMPLATE = $('<div id="' + this.PLAYER_ID + '"></div>');
    this.PLAYLIST_TEMPLATE = $('<div class="playlist-wrapper"></div>');
    this.player = null;
    this._done = false;
    this._isReady = false;


    //////////////////////////////////////////////////
    // Search methods
    //////////////////////////////////////////////////
    this.searchVideoIds = function(searchTerms){
        var self = this;
        //console.log('searchVideoIds', this.player);

        gapi.client.request({
            'path': 'https://content.googleapis.com/youtube/v3/search',
            'params': { 'part' : 'snippet',
                'q' : searchTerms.replace(/\-/g, ' '),
                'type' : 'video',
                'embeddable' : 'true',
                'key' : API_BROWSER_KEY }
            }).then(function(response){

                return self.getVideosByIds(response);

            }).then(function(idList) {
                // console.log('id list=', idList);
                return gapi.client.request({
                   'path': 'https://www.googleapis.com/youtube/v3/videos',
                   'params': { 'part' : 'snippet,contentDetails', 'id' : idList, 'key' : API_BROWSER_KEY }
                    });
            }).then(function(response){
                // console.log('collection of videos?', response);
                return self.buildVideoList(response);

            }).then(function(videos){
                //console.log('collection of videos?', response);
                self.buildVideoPlayer(videos);
        });
    }

    // display the playlist - allow us to add selected videos to localStorage
    this.buildPlaylistDisplay = function(videos){

        var $cont = $('#' + this.PLAYLIST_ID).html('');

        var $wrapper = this.PLAYLIST_TEMPLATE;
        var $ul = $('<ul class="list-unstyled"></ul>');

        for(var i=0;i<videos.length;i++){
            var video = videos[i];
            var cls = (i === 0) ? 'class="active" ' : '';
            var $li = $('<li ' + cls + 'data-video-id="' + video.ytVideoId + '" data-duration="' + video.duration + '"></li>');
            var $img = $('<img class="img-thumbnail" src="' + video.thumbnail + '" title="' + video["name"] + '" alt="' + video["name"] + '"/>');
            $ul.append($li.append($img));
        }

        $cont.append($wrapper.html($ul));
    }

    // don't show player until it is loaded with videos
    this.buildVideoPlayer = function(videos){
        // console.log('populate player', videos.length, this);

        var $playerContainer = $('#video_player');
        //console.log('ready:', this._isReady, ' - length:', videos.length);

        if(this._isReady && videos.length > 0){
            $playerContainer.show();

            // populate player with first video
            var video = videos[0];
            // console.log('last 30 in build player', userSettings.playLast30_get());

            this.player.loadVideoById({
                'videoId': video.ytVideoId,
                'startSeconds': (userSettings.playLast30_get() === 'true') ? video.endMinus30Seconds() : 0
            });

            userSettings.lastViewed_set(video);

            // build the playlist component
            this.buildPlaylistDisplay(videos);

        } else {
            $playerContainer.hide();
        }
    }

    // generate list of videoItems - ytVideo
    this.buildVideoList = function(response) {
        // console.log('building from ', response.result.items);
        var items = response.result.items;

         var videos = items.map(function(item){
            var idx = item["id"];
            var name = item.snippet["title"];
            var duration = item.contentDetails.duration;
            var thumbnail = item.snippet.thumbnails.default.url;
            // console.log('thumb', item, thumbnail);

            return new ytVideo(idx, name, duration, thumbnail);
        });

        userSettings.lastVideoMatches_set(videos);

        // console.log('the videos:', videos.length);
        return videos;
    }

    this.getVideosByIds = function(response) {

          var items = response.result.items;
          var idList = '';

          items.filter(function(itm) {
              return itm["id"].videoId || 0;
          }).reduce(function(prev, current, cIdx){
              idList += current["id"].videoId + ((cIdx < (items.length-1)) ? ',' : '');
          });

          return(idList);
    }


    //////////////////////////////////////////////////
    // Player methods
    //////////////////////////////////////////////////
    this.onYtIframeAPIReady = function () {
        // console.log('iframe api ready', this);

        this.player = new YT.Player(this.PLAYER_ID, {
            height: this.height,
            width: this.width,
            // videoId: playString,
            playerVars: {
                autoplay: 1,
                enablejsapi: 1
            },
            events: {
                'onReady': this.onYtPlayerReady,
                'onStateChange': this.onYtPlayerStateChange
            }
        });
    }

    // 4. The API will call this function when the video player is ready.
    this.onYtPlayerReady = function (event) {
        // console.log('YT Player ready', this, event);
        this._isReady = true;
    }.bind(this);

    this.onPlayerStateChange = function (event) {
        if (event.data == YT.PlayerState.PLAYING && !done) {
          setTimeout(this.stopVideo, 6000);
          this._done = true;
        }
    }

    this.stopVideo = function () {
        this.player.stopVideo();
    }

    // TODO not sure if anything needs to be done here
    // clear out any html that need to be refreshed
    this.resetPlayer = function () {

        if(this.player) {
        }
    }

    this.init = function () {
        this.onYtIframeAPIReady();
    }

    // init the player on creation
    this.init();
}


//////////////////////////////////////////////////
// Globals
//
//  youTube Apis call these methods globally
//////////////////////////////////////////////////

var ytPlayer;

//global function called by youtube iframe api
function onYouTubeIframeAPIReady() {
    ytPlayer = new YtPlayer($('.video-info'));
    //console.log('api ready', ytPlayer, gapi);
}

//global function called by javascript client
function onClientLoad() {
    gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}

function onYouTubeApiLoad() {
    // console.log('what api key?', gapi);
    gapi.client.setApiKey(ytPlayer.API_BROWSER_KEY);
}

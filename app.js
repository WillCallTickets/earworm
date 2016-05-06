////////////////////////////////////////////
//  app.js
//
//  main entry for the application
//  handles clicks for lyrics api calls and for
//  clicks on the listing of songs matched
//  also handles clicks on the playlist thumbs and
//  TODO clicks for adding videos to localStorage
////////////////////////////////////////////

var gMinSearchTokens = 3;
var gLyricsPageSize = 30;

var userSettings = {

    playLast30_get: function(){
        return _storageWrapper.get('playLast30') || true;
    },
    playLast30_set: function(bool){
        // console.log('set to ', bool);
        _storageWrapper.set('playLast30', bool);
    },
    lastViewed_get: function(){
        return _storageWrapper.get('lastViewed') || '';
    },
    lastViewed_set: function(video){
        _storageWrapper.set('lastViewed', video);
    },
    lastLyricSearch_get: function(){
        return _storageWrapper.get('lastLyricSearch') || '';
    },
    lastLyricSearch_set: function(lyrics){
        _storageWrapper.set('lastLyricSearch', lyrics);
    },
}

// home, settings, faq, contact
// row-home, row-matches, row-player, row-settings, row-faq, row-contact
var currentStep = 'home';//settings,faq,contact

$(function() {

    var $listContainer = $('ul#lyricMatchList');

    init();

    function init() {
        populateSettings();
        displayCurrentStep();
    }

    function togglePlaySetting(e) {
        var isChecked = $(e.target).is(':checked');
        userSettings.playLast30_set(isChecked);

        $('.play-last-setting').off('change');
        populateSettings();
        $('.play-last-setting').on('change', togglePlaySetting);
    }

    $('.play-last-setting').on('change', togglePlaySetting);

    function populateSettings(){
        //console.log('populate', userSettings.playLast30_get());
         $('.play-last-setting').bootstrapToggle((userSettings.playLast30_get() === 'true') ? 'on' : 'off');
    }

    function displayCurrentStep(){
        var $currentRow = $('.row-' + currentStep);
        var $sibs = $currentRow.siblings('.row');

        // console.log('player', ytPlayer);
        if(ytPlayer)
            ytPlayer.stopVideo();

        $sibs.hide('500', function() {
            $currentRow.show('900');
        });
    }

    $('.redo-search').on('click', function() {
        $('.inputs').html('');
        currentStep = 'home';
        displayCurrentStep();
    });

    // handle nav clicks
    $('.container-nav').on('click', 'button', function(e){
        // console.log('clicked', this, e.target);
        var selected = $(e.target);
        var currentSelection = $('.container-nav').find('button.active');

        if(selected != currentSelection){
            // console.log('new selection old/new', currentSelection.text(), selected.text());
            currentSelection.removeClass('active');
            selected.addClass('active');
            currentStep = selected.text().toLowerCase();

            displayCurrentStep();
        }
    });

    $('#evaluateLyrics').on('click', function(e) {

        toggleStop();

        //wait a second for everything to catch up
        // TODO fix timing issue when we click on match directly after start recording

        var $self = $(this);
        //  var input = $('#fakeSearch').val().trim();
        var input = $('#final_span').text().trim();

        //console.log('evaluate clicked', input);

        // reset prior search info - results of lyric api match
        $listContainer.html('');

        if(ytPlayer){
            ytPlayer.resetPlayer();
        }

        if (input.length > 0) {
            // set minimum # of tokens for search
            var pieces = input.split(' ');
            //console.log('pieces', pieces.length);
            if(pieces.length < gMinSearchTokens) {
                displayMessageGrowl('You need to input at least ' + gMinSearchTokens + ' words to match', 'warning');
                return;
            }

            userSettings.lastLyricSearch_set(input);

            $.ajax({
                type: "GET",
                data: {
                    apikey:"239cca557f05fed767290b6d5d931ad6",
                    q_lyrics:input,
                    f_has_lyrics: 1,
                    s_track_rating: 'desc',
                    page_size: gLyricsPageSize,
                    format:"jsonp",
                    },
                    url: "//api.musixmatch.com/ws/1.1/track.search",
                    dataType: "jsonp",
                    contentType: 'application/json',
                    success: processLyricApiCall,
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.log(jqXHR);
                    }
              });
        }
    });

    $('#lyricMatchList').on('click', 'li', function(e) {
        var $self = $(this);// always li
        var $tgt = $(e.target);

        searchForVideoBySelection($self);
    });

    $('#yt_playlist').on('click', 'li', function(e) {
        var $clicked = $(this);
        if(!$clicked.hasClass('active')){
            $(this).addClass('active').siblings().removeClass('active');

            var $img = $clicked.find('img');
            // src = img.thumbnail name = img.title
            var video = new ytVideo($clicked.attr('data-video-id'),
                $img.attr('title'),
                $clicked.attr('data-duration'),
                $img.attr('src'));

            // console.log('last 30 in playlist click', userSettings.playLast30_get());
            ytPlayer.player.loadVideoById({
                'videoId': video.ytVideoId,
                'startSeconds': (userSettings.playLast30_get() === 'true') ? video.endMinus30Seconds() : 0
            });

            userSettings.lastViewed_set(video);
        }
    });

    // clear out any previous input
    $('.reset-input').on('click', function(){
        var searchText = $('#final_span').text().trim();
        var len = searchText.length;
        $('.inputs').html('');

        if(len > 0)
            displayMessageGrowl('Your search has been cleared');
    });

    function searchForVideoBySelection($li){
        var artistName = $li.find('.artist-name').text();
        var trackName = $li.find('.track-name').text();
        //var albumName = $li.find('.album-name').text();
        //var releaseDate = $li.find('.first-release-date').text();
        //var spotifyTrackId = $li.attr('data-track-spotify-id');

        ytPlayer.searchVideoIds(artistName + ' ' + trackName);

        currentStep = 'player';
        displayCurrentStep();
    }

    // let's say a minimum requirement is that the track needs a spotify track id
    function processLyricApiCall(data) {
        //console.log('data', data);
        var listResults = data.message.body.track_list.filter(function(item){
            return  (item.track.track_spotify_id.length > 0);
        });

        var lastSearch = userSettings.lastLyricSearch_get();
        $('.row-matches h5').html('Your lyric search on <em>' + lastSearch +
            '</em> returned ' + listResults.length + ' results');

        if(listResults.length > 0){
            for(var i=0;i<listResults.length;i++){
                var track = listResults[i].track;

                $listContainer.append(formatLI(track));
            }
        }

        currentStep = 'matches';
        displayCurrentStep();
    }

    function formatLI(track){
        var li = '<li class="match-result" data-track-spotify-id="' + track.track_spotify_id + '">';
        li += '<span class="badge track-rating">' + track.track_rating + '</span> ';
        li += '<span class="li-wrapper">';
        li += '<span class="artist-name">' + track.artist_name + '</span> ';

        li += '<span class="track-name">' + track.track_name + '</span> ';

        li += '<span class="album-name">' + track.album_name + '</span> ';
        li += '<span class="first-release-date">' + new Date(track.first_release_date).getFullYear() + '</span> ';
        li += '</span>';//end wrapper
        li += '</li>';  // end li

        return li;
    }
});

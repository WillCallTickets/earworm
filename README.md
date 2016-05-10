
# Earworm

"Earworm" is a term for a song that gets stuck in your head (and you can't get
rid of). Some theories exist that say by listening to the end of the song, your
brain is able to "resolve" the song, thereby eliminating your earworm.  

This app will aid you in recording the lyrics of a song you wish to match, then
do a search on those lyrics and present you with video choices obtained from
youtube that you can select and listen to. Hopefully this will aid you in
eliminating your own earworms!

Simply tap the "start recording" button from the home page and sing or speak the
lyrics of the song stuck in your head. Only a few words are necessary, but to
keep the result list to a reasonable size, you are required to input at least 3
words. When you have entered in your request, press the button labeled "stop
recording" and click on the "find results" button. You will be presented with a
list of songs and clicking on one of these will load the video into the player
cued up to the last 30 seconds of the song.
Should you find that you would like to listen to the entire song, go to the
settings page and toggle the setting for "Play last 30 seconds."

Old searches are stored in local storage so you won't have to worry if an old
earworm makes it back into your personal rotation.


#### Technologies used

Earworm was designed with Bootstrap-sass and utilizes the bootswatch theme
"Superhero" for styling as well as bootstrap-toggle which was used for the
settings page.

AudioRecorder.js was used to indicate that the app is receiving audio input.

Moment.js was used to parse the duration string received from Youtube.

Growl.js was used to display any errors.

Musixmatch lyric search api was used to match the lyrics to artist and songs.
The only requirement being that the matched song needed to possess a Spotify
track Id. This was done to reduce the amount of results as well as to ensure the
results obtained were actually songs.

YouTube search API was used to match the results from Musixmatch by song and
artist to video titles available on you tube. An initial call would yield the id
of any matching videos and a second call provided more information on the video
in question. Specifically, the duration information was extracted to calculate
the last 30 seconds of the song.

Finally, the Youtube iframe api along was utilized to present the Youtube
player.

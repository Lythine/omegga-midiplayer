# omegga-midiplayer
 A midi player plugin for omegga that rapidly loads and clears bricks with sound components to create music. Due to the lack of proper instrument sounds, this plugin currently uses some rather dubious sounds to create music. 

## Instructions
 1. `omegga install gh:Lythine/midiplayer`
 2. Put your midis in the `plugins/midiplayer/mid` folder. They will load with the plugin and can be reloaded in-game with the command `/midi-reload`.

## Commands
 - `midi-load [Song Name]` - Loads a midi file for playing. Will automatically begin playing the chosen song.
 - `midi-random` - Randomly chooses a midi in the `mid` folder to play, and then plays it.
 - `midi-list` - Lists all of the available midis for playing in the `mid` folder.
 - `midi-reload` - Reloads the list of midis. **Use this after putting new midis in the folder!**
 - `midi-play` - Resumes playback of the currently loaded midi.
 - `midi-stop` - Stops the playback of the currently loaded midi.
 - `midi-pause` - Pauses playback of the currently loaded midi. 
 - `midi-np` - Stands for Now Playing, shows information on how long the midi is, it's current progress, and if it's set to loop.
 - `midi-loop` - Toggles looping on and off.
 - `midi-volume [Volume, 1-100]` - Sets the volume of the midi player.

## Configs
 These can be set using the omegga webpanel.
 - `authorized` - A list of players. If more or one player is defined here, only the specified user(s) can use this plugin's commands.
 - `loop` - Turns looping on or off. Defaults to off.
 - `autoplaySong` - If defined, this song will immediately load and begin playing when the plugin is loaded.
 - `noteVisibility` - Turns the visibility of note bricks on or off. Defaults to on.
 - `cooldownTime` - In milliseconds, how long players have to wait inbetween commands. Defaults to 1000.
 - `positionOffset` - X, Y, and Z coordinate values that will offset the midi player's bricks. Defaults to 0 0 0. It's recommended to use the `tp` command to find where you would like to move the midi player to first.
 - `volumeSetting` - Sets the volume of the midi player when the plugin first loads. Defaults to 100.


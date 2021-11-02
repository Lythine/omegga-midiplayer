const fs = require('fs');
const midi = require('midi-player-js');
const brs = require('brs-js');

const noteFile = fs.readFileSync(__dirname + "/brs/Heart2.brs");
let midis = fs.readdirSync(__dirname + "/mid");

let brickOwners = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
let deathTimers = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
let channelSettings = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
let cooldowns = {};
let currentSong = "";
let loop = false;
let volumeSetting = 100;
let positionOffset = [0, 0, 0];
let noteVisibility = true;
let autoplaySong = "";
let authorized = [];

const newOwner = (channel, poly) => {
  brickOwners[channel][poly] = {
    id: '00000000-1a57-111c-111b-' + ((0.5 * (channel + poly) * (channel + poly + 1)) + poly).toString(16).padStart(12, '0'),
    name: 'BRICKINSTRUMENT'+channel+'-'+poly,
    bricks: 1
  }
  return brickOwners[channel][poly];
};

const deathTimer = (channel, poly) => {
  Omegga.clearBricks(brickOwners[channel][poly], {quiet: true});
  brickOwners[channel][poly] = undefined;
}

const clearSongBricks = (overwriteChannelSettings) => {
  if (overwriteChannelSettings) {
    channelSettings = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  }
  deathTimers = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
  for (let i = 0; i < brickOwners.length; i++) {
    if (!brickOwners[i]) continue;
    for (let b = 0; b < brickOwners[i].length; b++) {
      if (!brickOwners[i][b]) continue;
      Omegga.clearBricks(brickOwners[i][b], {quiet: true});
    }
  }
  brickOwners = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
}

let pitchTable = { // I hate this thing
  "bassThreshold": 47,
  "upperThreshold": 77,
  "38": 0.63, // 38 - 47 Are only meant to be used for BA_AMB_Component_Air_Conditioning_Buzzy_2
  "39": 0.68, 
  "40": 0.73, 
  "41": 0.77, 
  "42": 0.87, 
  "43": 0.82, 
  "44": 0.92, 
  "45": 0.97, 
  "46": 1.03, 
  "47": 1.09, 
  "48": 0.4, // 48 - 76 Are only meant to be used for BA_AMB_Component_Hospital_Monitors_Heart_3
  "49": 0.42,
  "50": 0.45,
  "51": 0.47,
  "52": 0.5,
  "53": 0.53,
  "54": 0.56,
  "55": 0.59,
  "56": 0.63,
  "57": 0.67,
  "58": 0.71,
  "59": 0.75,
  "60": 0.79,
  "61": 0.84,
  "62": 0.89,
  "63": 0.94,
  "64": 1,
  "65": 1.06,
  "66": 1.12,
  "67": 1.18,
  "68": 1.26,
  "69": 1.34,
  "70": 1.41,
  "71": 1.5,
  "72": 1.59,
  "73": 1.68,
  "74": 1.78,
  "75": 1.88,
  "76": 2,
  "77": 1.39, // 77 - 78 Are only meant to be used for BA_AMB_Component_Hospital_Monitors_Heart_3
  "78": 1.47,
  "79": 0.41, // 79 - 107 Are only meant to be used for BA_AMB_Component_Hospital_Monitors_Heart_1
  "80": 0.43,
  "81": 0.46,
  "82": 0.48,
  "83": 0.51,
  "84": 0.54,
  "85": 0.57,
  "86": 0.61,
  "87": 0.65,
  "88": 0.69,
  "89": 0.73,
  "90": 0.77,
  "91": 0.82,
  "92": 0.86,
  "93": 0.92,
  "94": 0.97,
  "95": 1.03,
  "96": 1.09,
  "97": 1.15,
  "98": 1.22,
  "99": 1.29,
  "100": 1.37,
  "101": 1.46,
  "102": 1.54,
  "103": 1.64,
  "104": 1.72,
  "105": 1.83,
  "106": 1.91,
  "107": 2
 } 

class midiplayer {
  constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    volumeSetting = this.config.volumeSetting;
    positionOffset = this.config.positionOffset;
    noteVisibility = this.config.noteVisibility;
    autoplaySong = this.config.autoplaySong;
    authorized = this.config.authorized;
    if (!authorized) authorized = [];
    loop = this.config.loop;  
    this.midip = new midi.Player(function(event) {
      if (event.name == 'Note on') {
        if (event.channel == 10) return
        if (event.velocity == 0) {
          clearTimeout(deathTimers[event.channel][event.noteNumber]);
          Omegga.clearBricks(brickOwners[event.channel][event.noteNumber], {quiet: true});
          deathTimers[event.channel][event.noteNumber] = undefined;
          brickOwners[event.channel][event.noteNumber] = undefined;
          return
        }
        if (!deathTimers[event.channel]) {
          deathTimers[event.channel] = [];
        }
        if (pitchTable[event.noteNumber]) {
          let note = brs.read(noteFile);
          if (event.noteNumber <= pitchTable.bassThreshold) {
            note.bricks[0].components.BCD_AudioEmitter.AudioDescriptor = "BA_AMB_Component_Air_Conditioning_Buzzy_2";
            note.bricks[0].color = [0, 255, 0];
            deathTimers[event.channel][event.noteNumber] = setTimeout(function() {deathTimer(event.channel, event.noteNumber)}, 3000 / pitchTable[event.noteNumber]);
            note.bricks[0].components.BCD_AudioEmitter.VolumeMultiplier = ((event.velocity/110) * (channelSettings[event.channel - 1].volume ? channelSettings[event.channel - 1].volume : 1)) * (volumeSetting/100);
          } else if (event.noteNumber >= pitchTable.upperThreshold) {
            if (event.noteNumber == pitchTable.upperThreshold || event.noteNumber - 1 == pitchTable.upperThreshold) {
              note.bricks[0].components.BCD_AudioEmitter.AudioDescriptor = "BA_AMB_Component_Hospital_Monitors_Heart_3";
              note.bricks[0].color = [255, 0, 0];
              deathTimers[event.channel][event.noteNumber] = setTimeout(function() {deathTimer(event.channel, event.noteNumber)}, 170 / pitchTable[event.noteNumber]);
            } else {
              note.bricks[0].components.BCD_AudioEmitter.AudioDescriptor = "BA_AMB_Component_Hospital_Monitors_Heart_1";
              note.bricks[0].color = [0, 0, 255];
              deathTimers[event.channel][event.noteNumber] = setTimeout(function() {deathTimer(event.channel, event.noteNumber)}, 600 / pitchTable[event.noteNumber]);
            }
            note.bricks[0].components.BCD_AudioEmitter.VolumeMultiplier = ((event.velocity/50) * (channelSettings[event.channel - 1].volume ? channelSettings[event.channel - 1].volume : 1)) * (volumeSetting/100);
          } else {
            note.bricks[0].components.BCD_AudioEmitter.VolumeMultiplier = ((event.velocity/100) * (channelSettings[event.channel - 1].volume ? channelSettings[event.channel - 1].volume : 1)) * (volumeSetting/100);
            deathTimers[event.channel][event.noteNumber] = setTimeout(function() {deathTimer(event.channel, event.noteNumber)}, 600 / pitchTable[event.noteNumber]);
          }
          note.bricks[0].components.BCD_AudioEmitter.PitchMultiplier = pitchTable[event.noteNumber];
          note.bricks[0].visibility = noteVisibility;
          note.bricks[0].position = note.bricks[0].position.map(function (n, i) {
            if (!positionOffset || positionOffset.length != 3) {
              positionOffset = [0, 0, 0];
            }
            return n + [0 + positionOffset[0], (event.channel * 2) + positionOffset[1], (event.noteNumber * 2) + positionOffset[2]][i];
          })
          if (brickOwners[event.channel][event.noteNumber]) {
            note.brick_owners[0] = brickOwners[event.channel][event.noteNumber];
          } else {
            note.brick_owners[0] = newOwner(event.channel, event.noteNumber)
          }
          Omegga.loadSaveData(note, {quiet: true});
        } else {
          //console.log("Pitch exceeds thresholds! ("+event.noteName+")");
        }
      } else if (event.name == 'Note off') {
        if (!deathTimers[event.channel]) {
          deathTimers[event.channel] = [];
        }
        clearTimeout(deathTimers[event.channel][event.noteNumber]);
        if (brickOwners[event.channel]) {
          Omegga.clearBricks(brickOwners[event.channel][event.noteNumber], {quiet: true});
          brickOwners[event.channel][event.noteNumber] = undefined;
        }
        deathTimers[event.channel][event.noteNumber] = undefined;
      } else if (event.name == "Controller Change") {
        if (!channelSettings[event.channel]) channelSettings[event.channel] = {}
        switch (event.number) { 
          case 7: // Controller 7 is a channel's volume modifier from 0-127
            channelSettings[event.channel].volume = (event.value + 1) / 128
            break;
          case 120: // Controller 120 is channel mode message for all sound off
            clearSongBricks(false);
            break;
          case 123: // Controller 123 is channel mode message for all notes off
            clearSongBricks(false);
            break;
          default:
            break;
        }
      }
    });
    const midip = this.midip;
    this.midip.on('endOfFile', function() {
      if (loop) {
        setTimeout(() => {
          clearSongBricks(true);
          midip.play();
        }, 1)
      } else {
        clearSongBricks(true);
      }
    });
    if (autoplaySong) {
      if (midis.some(x => x.toLowerCase() == autoplaySong.toLowerCase()) || midis.some(x => x.toLowerCase() == autoplaySong.toLowerCase() + ".mid") || midis.some(x => x.toLowerCase() == autoplaySong.toLowerCase() + ".midi")) {
        let foundSong = midis.filter(x => x.toLowerCase() == autoplaySong.toLowerCase());
        if (foundSong.length == 0) {
          foundSong = midis.filter(x => x.toLowerCase() == autoplaySong.toLowerCase() + ".mid");
          if (foundSong.length == 0) {
            foundSong = midis.filter(x => x.toLowerCase() == autoplaySong.toLowerCase() + ".midi");
          }
        }
        this.midip.stop();
        clearSongBricks(true);
        this.midip.loadArrayBuffer(fs.readFileSync(__dirname + '/mid/' + foundSong));
        this.midip.play();
        currentSong = foundSong;
      } else {
        console.log(`Couldn't find a midi with the name ${autoplaySong}!`);
      }
    }
  }

  async init() {
    Omegga.on('cmd:midi-load', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        let songname = args.join(" ");
        if (midis.some(x => x.toLowerCase() == songname.toLowerCase()) || midis.some(x => x.toLowerCase() == songname.toLowerCase() + ".mid") || midis.some(x => x.toLowerCase() == songname.toLowerCase() + ".midi")) {
          let foundSong = midis.filter(x => x.toLowerCase() == songname.toLowerCase());
          if (foundSong.length == 0) {
            foundSong = midis.filter(x => x.toLowerCase() == songname.toLowerCase() + ".mid");
            if (foundSong.length == 0) {
              foundSong = midis.filter(x => x.toLowerCase() == songname.toLowerCase() + ".midi");
            }
          }
          this.midip.stop();
          clearSongBricks(true);
          this.midip.loadArrayBuffer(fs.readFileSync(__dirname + '/mid/' + foundSong));
          this.midip.play();
          currentSong = foundSong;
          Omegga.broadcast(`${name}: <color="999999">Loaded</> ${foundSong} <color="999999">successfully! Playing...</>`)
        } else {
          Omegga.whisper(name, `No midi found with the name ${OMEGGA_UTIL.chat.sanitize(songname)}.`)
        }
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-random', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        let randomSong = midis[Math.floor(Math.random() * midis.length)]
        this.midip.stop();
        clearSongBricks(true);
        this.midip.loadArrayBuffer(fs.readFileSync(__dirname + '/mid/' + randomSong));
        this.midip.play();
        currentSong = randomSong;
        Omegga.broadcast(`${name}: <color="999999">Random Song Loaded: </>${randomSong}<color="999999">! Playing...</>`)
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-list', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        Omegga.whisper(name, midis.join(`\n`));
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-reload', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        midis = fs.readdirSync(__dirname + "/mid");
        Omegga.whisper(name, `Song list reloaded. ${midis.length} song${midis.length > 1 ? 's' : ''} detected!`);
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })
    
    Omegga.on('cmd:midi-play', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        this.midip.play();
        Omegga.broadcast(`${name} <color="999999">resumed the song.</>`)
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-pause', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        this.midip.pause();
        clearSongBricks(false);
        Omegga.broadcast(`${name} <color="999999">paused the song.</>`)
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-stop', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        this.midip.stop();
        clearSongBricks(true);
        Omegga.broadcast(`${name} <color="999999">stopped the song.</>`)
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-np', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
        Omegga.whisper(name, `<color="00FFFF">Now Playing: ${currentSong}</>\n${new Date(Math.round(this.midip.getSongTime()) * 1000 - this.midip.getSongTimeRemaining() * 1000).toISOString().substr(11, 8)} / ${new Date(Math.round(this.midip.getSongTime()) * 1000).toISOString().substr(11, 8)} <color="999999">(${100-this.midip.getSongPercentRemaining()}%)</>${this.config.loop ? ` (Looping)` : ``}`)
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    Omegga.on('cmd:midi-loop', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
          loop = !loop;
          (loop ? Omegga.whisper(name, `Looping enabled.`) : Omegga.whisper(name, `Looping disabled.`))
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })
    
    Omegga.on('cmd:midi-volume', (name, ...args) => {
      if (authorized.length > 0) {
        if (!authorized.some(x => x.name == name)) return;
      }
      if ((!cooldowns[name]) || cooldowns[name] < Date.now()) {
          if (parseInt(args[0]) > -1 && parseInt(args[0]) < 101) {
            volumeSetting = parseInt(args[0]);
            Omegga.broadcast(`${name} <color="999999">set the volume set to</> ${parseInt(args[0])}.`)
          } else {
            Omegga.whisper(name, `Volume out of available range.`)
          }
        cooldowns[name] = Date.now() + this.config.cooldownTime;
      }
    })

    return { registeredCommands: ['midi-load', 'midi-random', 'midi-list', 'midi-reload', 'midi-play', 'midi-pause', 'midi-stop', 'midi-np', 'midi-loop', 'midi-volume'] };
  }

  async stop() {
    clearSongBricks(true);
  }
}

module.exports = midiplayer;
let notes_to_numbers = {
  "A1": "1",
  "A#1": "2",
  "B1": "3",
  "C1": "4",
  "C#1": "5",
  "D1": "6",
  "D#1": "7",
  "E1": "8",
  "F1": "9",
  "F#1": "10",
  "G1": "11",
  "G#1": "12",
  "A2": "13",
  "A#2": "14",
  "B2": "15",
  "C2": "16",
  "C#2": "17",
  "D2": "18",
  "D#2": "19",
  "E2": "20",
  "F2": "21",
  "F#2": "22",
  "G2": "23",
  "G#2": "24",
  "A3": "25",
  "A#3": "26",
  "B3": "27",
  "C3": "28",
  "C#3": "29",
  "D3": "30",
  "D#3": "31",
  "E3": "32",
  "F3": "33",
  "F#3": "34",
  "G3": "35",
  "G#3": "36",
  "A4": "37",
  "A#4": "38",
  "B4": "39",
  "C4": "40",
  "C#4": "41",
  "D4": "42",
  "D#4": "43",
  "E4": "44",
  "F4": "45",
  "F#4": "46",
  "G4": "47",
  "G#4": "48",
  "A5": "49",
  "A#5": "50",
  "B5": "51",
  "C5": "52",
  "C#5": "53",
  "D5": "54",
  "D#5": "55",
  "E5": "56",
  "F5": "57",
  "F#5": "58",
  "G5": "59",
  "G#5": "60",
  "A6": "61",
  "A#6": "62",
  "B6": "63"
}
var synth;
var beat = 0;
var id_ctr = 0;

var sound_ready = new Promise((resolve) => {
  document.body.addEventListener('click', () => {
    console.log('Setting up the audio after user click');
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    Tone.Transport.bpm.value = 120;
    resolve();
  }, { once: true });
});

var notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
var octaves = ["1", "2", "3", "4", "5"];
var chords = octaves
  .reduce((acc, octave) => acc.concat(notes.map(note => note + octave)), [])
  .concat(["A6", "A#6", "B6"]);
var groups = new vis.DataSet(chords.map(c => ({content: c, id: c, order: -Tone.Frequency(c), className: c.includes("#") ? "black" : "white"})));
var items = new vis.DataSet();
var options = {
  type: "range",
  orientation: 'top',
  margin: 0,
  verticalScroll: true,
  zoomKey: 'ctrlKey',
  editable: true,
  min: 0,
  max: 1000,
  start: 0,
  end: 336,
  itemsAlwaysDraggable: {item: true, range: true},
  showMajorLabels: false,
  timeAxis:{scale:'millisecond', step: 4},
  format: {
    minorLabels: (date,scale,step) => (new Date(date).getTime() + ""),
    majorLabels: (date,scale,step) => (new Date(date).getTime() + ""),
  },
  onAdd: async function (item, callback) {
    await sound_ready;
    item.start = (new Date(item.start)).getTime();
    item.end = item.start + 12;
    item.content = (item.end - item.start).toString();
    item.id = id_ctr++;
    synth.triggerAttackRelease(item.group, 0.5);
    callback(item); // send back adjusted item
  },
  onMove: async function (item, callback) {
    await sound_ready;
    item.start = (new Date(item.start)).getTime();
    item.end = (new Date(item.end)).getTime();
    synth.triggerAttackRelease(item.group, ((item.end - item.start)/48));
    callback(item); // send back adjusted item
  },
  onMoving: function (item, callback) {
    item.content = (item.end - item.start).toString();
    callback(item); // send back adjusted item
  },
  snap: function (date, scale, step) {
    return date.getTime() > 0 ? date : 0;
  }
};
var container = document.getElementById('visualization');
var timeline = new vis.Timeline(container, items, groups, options);

// Set first time bar
timeline.addCustomTime(0, 't1');
timeline.on('timechanged', function (properties) { beat = properties.time.getTime(); });
timeline.on('click', async function (properties) {
  await sound_ready;
  if(properties.what == "group-label"){
    synth.triggerAttackRelease(properties.group, 0.5);
  }
});

// This is our callback function. It will execute repeatedly 
Tone.Transport.scheduleRepeat((time) => {
  timeline.setCustomTime(beat ,'t1');
  var notes_to_play = items.get({filter: item => (item.start === beat)});
  notes = notes_to_play.map(note => note.group);
  durations = notes_to_play.map(note => (note.end - note.start).toString()/48);
  synth.triggerAttackRelease(notes, durations)
  beat += 1;
}, "48hz");

document.getElementById("toggle_play").addEventListener("click", (e) => Tone.Transport.toggle());
document.getElementById("reset").addEventListener("click", (e) => { timeline.setCustomTime(beat = 0 ,'t1'); });

function format_song_rom(rom_notes) {
  return rom_notes.reduce((acc, cur, idx) => {
    acc += `assign memory[${idx}] = ${cur.action_type ? `{1'b1, 6'd${cur.duration}, 6'd0, 3'b000}` : `{1'b0, 6'd${cur.duration}, 6'd${cur.note}, 3'b${cur.metadata}}`}\n`;
    return acc;
  }, "");
}

function split_duration(full_duration) {
  let durations_list = Array(Math.floor(full_duration / 63)).fill(63);
  if(full_duration % 63 > 0){
    durations_list.push(full_duration % 63);
  }
  return durations_list;
}
document.getElementById("compose").addEventListener("click", (e) => {
  let cur_time = 0;
  let ordered_notes = items.get({order: "start"});
  let rom_notes = [];
  for (let note of ordered_notes) {
    if(cur_time < note.start){
      rom_notes.push(...split_duration(note.start - cur_time).map(d => ({action_type: 1, duration: d})));
      cur_time = note.start;
    }
    rom_notes.push({action_type: 0, duration: note.end - note.start, note: notes_to_numbers[note.group] || "0", metadata: "000"});
  }
  rom_notes.push(...split_duration(items.max("end").end - cur_time).map(d => ({action_type: 1, duration: d})));
  console.log("rom_notes: ", rom_notes);
  document.getElementById('code_area').textContent = format_song_rom(rom_notes);
  document.getElementById('code_modal').showModal();
});
// timeline.on('itemover', (data) => { console.log(JSON.stringify(items.get(data.item))); });


function parseFile(file) {
  //read the file
  const reader = new FileReader();
  reader.onload = function (e) {
      const midi = new Midi(e.target.result);
      currentMidi = midi;
      console.log(midi.tracks);
      midi.tracks.forEach(track => {
          let new_items = track.notes.map(note => {
            return {
                start: Math.round(note.time * 48),
                end: Math.round(48 * (note.time + note.duration)),
                group: note.name,
                content: Math.round(48 * note.duration).toString()
            }
        });
        console.log(new_items);
        items.add(new_items);
      });
  };
  reader.readAsArrayBuffer(file);
}

document.getElementById("midiSelector").addEventListener("cancel", () => {
  console.log("Cancelled.");
});
document.getElementById("midiSelector").addEventListener("change", () => {
  if (document.getElementById("midiSelector").files.length == 1) {
    console.log("File selected: ", document.getElementById("midiSelector").files[0]);
    parseFile(document.getElementById("midiSelector").files[0]);
  }
});

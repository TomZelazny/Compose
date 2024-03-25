var synth;
var beat = 0;

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

var id_ctr = 0;
var items = new vis.DataSet([
// {start:0, end: 48, group:"1F", className:"1F", content:"",id:"1"},
// {start: 2, end: 26, group:"2D", className:"2D", content:"",id:"2"},
// {start: 3, end: 27, group:"1A", className:"1A", content:"",id:"3"},
// {start: 4, end: 28, group:"3C", className:"3C", content:"",id:"4"},
// {start: 5, end: 29, group:"2E", className:"2E", content:"",id:"5"},
// {start: 6, end: 10, group:"2C", className:"2C", content:"",id:"6"},
// {start: 7, end: 12, group:"1C", className:"1C", content:"",id:"7"},
// {start: 8, end: 13, group:"2D", className:"2D", content:"",id:"8"},
// {start: 9, end: 10, group:"1C", className:"1C", content:"",id:"9"},
// {start: 5, end: 10, group:"3E", className:"3E", content:"",id:"10"},
// {start: 4, end: 8, group:"2C", className:"2C", content:"",id:"11"},
// {start: 2, end: 4, group:"3D", className:"3D", content:"",id:"12"},
// {start: 15, end: 15, group:"3F", className:"3F", content:"",id:"13"},
// {start: 2, end: 15, group:"3F", className:"3F", content:"",id:"14"},
// {start: 4, end: 15, group:"3D", className:"3D", content:"",id:"15"},
// {start: 7, end: 15, group:"2B", className:"2B", content:"",id:"16"},
// {start: 6, end: 15, group:"1B", className:"1B", content:"",id:"17"},
// {start: 3, end: 15, group:"6B", className:"1B", content:"",id:"18"},
])


// create visualization
var container = document.getElementById('visualization');
var options = {
  type: "range",
  orientation: 'top',
  margin: 0,
  verticalScroll: true,
  zoomKey: 'ctrlKey',
  editable: true,
  // groupEditable: true,
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

document.getElementById("toggle_play").addEventListener("click", (event) => Tone.Transport.toggle());
document.getElementById("reset").addEventListener("click", (event) => { timeline.setCustomTime(beat = 0 ,'t1'); });

function split_duration(full_duration) {
  let durations_list = Array(Math.floor(full_duration / 63)).fill(63);
  if(full_duration % 63 > 0){
    durations_list.push(full_duration % 63);
  }
  return durations_list;
}
document.getElementById("compose").addEventListener("click", (event) => {
  let cur_time = 0;
  let ordered_notes = items.get({order: "start"});
  let rom_notes = [];
  for (let note of ordered_notes) {
    if(cur_time < note.start){
      rom_notes.push(...split_duration(note.start - cur_time).map(d => ({action_type: 1, duration: d})));
      cur_time = note.start;
    }
    rom_notes.push({action_type: 0, duration: note.end - note.start, note: note.group, metadata: "000"});
  }
  rom_notes.push(...split_duration(items.max("end").end - cur_time).map(d => ({action_type: 1, duration: d})));
  console.log("rom_notes: ", rom_notes);
});
// timeline.on('itemover', (data) => { console.log(JSON.stringify(items.get(data.item))); });
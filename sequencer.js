var chords = ["A", "A#/Bb", "B", "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab"];
var chord_numbers = ["1", "2", "3", "4", "5"];
var chord_names = chord_numbers.reduce((acc, cur) => acc.concat(chords.map(c => cur + c)), []).concat(["6A", "6A#/Bb", "6B"]);
var groups = new vis.DataSet(chord_names.map(c => ({content: c, id: c, value: c, className:"instrument"})));

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
  groupOrder: function (a, b) { return a.value - b.value; },
  orientation: 'both',
  editable: true,
  groupEditable: true,
  min: 0,
  start: 0,
  end: 144,
  itemsAlwaysDraggable: {item: true, range: true},
  showMajorLabels: true,
  format: {
    minorLabels: (date,scale,step) => (new Date(date).getTime() + ""),
    majorLabels: (date,scale,step) => (new Date(date).getTime() + ""),
  },
  timeAxis:{scale:'millisecond', step: 48},
  onAdd: function (item, callback) {
    item.start = (new Date(item.start)).getTime();
    item.end = item.start + 12;
    item.content = (item.end - item.start).toString();
    callback(item); // send back adjusted item
  },
  onMoving: function (item, callback) {
    item.content = (item.end - item.start).toString();
    callback(item); // send back adjusted item
  }
};

var timeline = new vis.Timeline(container, items, groups, options);
/* 		groupTemplate: function(group){
        var container = document.createElement('div');
        var label = document.createElement('span');
        label.innerHTML = group.content + ' ';
        container.insertAdjacentElement('afterBegin',label);
        var hide = document.createElement('button');
        hide.innerHTML = 'hide';
        hide.style.fontSize = 'small';
        hide.addEventListener('click',function(){
          groups.update({id: group.id, visible: false});
        });
        container.insertAdjacentElement('beforeEnd',hide);
        return container;
      }, */

// Set first time bar
timeline.addCustomTime(0, 't1');
timeline.on('timechanged', function (properties) {
  beat = properties.time.getTime();
});
initialized = false;
var beat = 0;

// document.getElementById("initialize").addEventListener("click", (event) => {
// synths = [
//   new Tone.Synth({ oscillator: { type: "square8" } }).toDestination(),
//   new Tone.Synth({ oscillator: { type: "square8" } }).toDestination(),
//   new Tone.Synth({ oscillator: { type: "square8" } }).toDestination(),
// ];
// });
  // This is our callback function. It will execute repeatedly 
Tone.Transport.scheduleRepeat((time) => {
  // console.log(time, JSON.stringify(timeline.getCustomTime('t1')));
  timeline.setCustomTime(beat ,'t1');
  var filtered = items.get({
    filter: item => (item.start <= beat && item.end >= beat)
  });
  console.log(filtered);
  if(beat % 48 === 0) {synth.triggerAttackRelease("Bb4", "1n")} else if(beat % 48 === 24) {synth.triggerAttackRelease("F3", "1n")};
  if(beat % 48 === 0) {synth.triggerAttackRelease("C1", "1n")} else if(beat % 48 === 24) {synth.triggerAttackRelease("E2", "1n")};
  beat += 1;
}, "48hz");
  // set the tempo in beats per minute.
  // telling the transport to execute our callback function every eight note.

document.getElementById("toggle_play").addEventListener("click", (event) => {
  if(initialized == false){
    synth = new Tone.PolySynth(Tone.Synth).toDestination(),

    Tone.Transport.bpm.value = 100;
    initialized = true;
  }
  Tone.Transport.toggle();
});
document.getElementById("reset").addEventListener("click", (event) => {
  beat = 0;
  timeline.setCustomTime(beat ,'t1');
});

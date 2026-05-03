import { getSharedAudioContext } from './audioContext';

class Metronome {
  constructor() {
    this.audioContext = null;
    this.currentTick = 0; // 12 ticks per beat
    this.nextNoteTime = 0.0;
    this.scheduleAheadTime = 0.1; // seconds
    this.lookahead = 25.0; // ms
    this.timerID = null;
    this.isPlaying = false;
    
    // Config
    this.tempo = 120;
    this.beatsPerBar = 4;
    this.subdivision = 1; // 1 = Quarter, 2 = Eighth, 3 = Triplet, 4 = Sixteenth
    this.volume = 0.8;
    
    this.onTick = null;
    this.onScheduledNote = null;
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += (secondsPerBeat / 12);
    this.currentTick++;
    if (this.currentTick === this.beatsPerBar * 12) {
      this.currentTick = 0;
    }
  }

  scheduleNote(tick, time) {
    const isBeat = (tick % 12) === 0;
    const isEighth = this.subdivision === 2 && (tick % 6) === 0;
    const isTriplet = this.subdivision === 3 && (tick % 4) === 0;
    const isSixteenth = this.subdivision === 4 && (tick % 3) === 0;

    let shouldPlay = false;
    let frequency = 440;
    let isAccent = false;

    if (isBeat) {
      shouldPlay = true;
      if (tick === 0) {
        frequency = 1000; // Accent on beat 1
        isAccent = true;
      } else {
        frequency = 800; // Normal beat
      }
    } else if (isEighth || isTriplet || isSixteenth) {
      shouldPlay = true;
      frequency = 600; // Subdivision tick
    }

    if (shouldPlay) {
      if (this.onTick) {
        const timeUntilNote = time - this.audioContext.currentTime;
        setTimeout(() => {
          this.onTick(isAccent, isBeat, !isBeat);
        }, Math.max(0, timeUntilNote * 1000));
      }
      
      if (this.onScheduledNote) {
        this.onScheduledNote({
          time,
          isAccent,
          isBeat,
          isSubdivision: !isBeat,
          tick
        });
      }

      // Audio generation
      const osc = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();

      osc.frequency.value = frequency;
      // Use square wave for a sharper "click" sound
      osc.type = 'square';
      
      const clickVolume = isAccent ? this.volume : (isBeat ? this.volume * 0.8 : this.volume * 0.4);

      envelope.gain.setValueAtTime(clickVolume, time);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(envelope);
      envelope.connect(this.audioContext.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  scheduler() {
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentTick, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  start() {
    if (this.isPlaying) return;
    if (this.audioContext == null) {
      this.audioContext = getSharedAudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentTick = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
  }

  setTempo(tempo) {
    this.tempo = Math.max(30, Math.min(tempo, 300));
  }
  
  setBeatsPerBar(beats) {
    this.beatsPerBar = beats;
  }
  
  setSubdivision(subdiv) {
    this.subdivision = subdiv;
  }
}

export const metronome = new Metronome();

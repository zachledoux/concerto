// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// NoteManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.NoteManager
 */
Concerto.Parser.NoteManager = function(attributesManager) {
    this.duration = 0;
    this.attributesManager = attributesManager;
    this.notes = [];
    this.notesList = [this.notes];
    this.staffList = [];
    this.staffUndecided = true;
};

/**
 * @this {Concerto.Parser.NoteManager}
 * @param {Object} staveNote
 * @param {Object} note
 */
Concerto.Parser.NoteManager.prototype.addStaveNote = function(staveNote, note) {
    var duration = note['duration'];
    var voice = note['voice'];
    var staff = note['staff'];
    
    if(staff == undefined) {
        staff = 1;
    }
    if(this.staffUndecided) {
        this.staffList.push(staff);
        this.staffUndecided = false;
    }
    this.duration += duration;
    this.notes.push(staveNote);

};

/**
 * @this {Concerto.Parser.NoteManager}
 * @param {number}
 */
Concerto.Parser.NoteManager.prototype.addBackup = function(duration) {
    var divisions = this.attributesManager.getDivisions();
    this.staffUndecided = true;
    this.duration -= duration;
    this.notes = [];
    if(this.duration > 0) {
        // if back appears, it means change of voice.
        var noteType = Concerto.Parser.NoteManager.getStaveNoteTypeFromDuration(this.duration, divisions);
        var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
        this.notes.push(ghostNote);
    }
    
    this.notesList.push(this.notes);
};

/**
 * @this {Concerto.Parser.NoteManager}
 * @param {number}
 */
Concerto.Parser.NoteManager.prototype.addForward = function(duration) {
    var divisions = this.attributesManager.getDivisions();
    this.duration += duration;
    var noteType = Concerto.Parser.NoteManager.getStaveNoteTypeFromDuration(duration, divisions);
    var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
    this.notes.push(ghostNote);
};

/**
 * @this {Array.<Object>}
 * @return {Array}
 */
Concerto.Parser.NoteManager.prototype.getVoices = function(staves) {
    var voices = [];
    var preStaff = this.staffList[0];
    var staffVoices = [];
    var stave = undefined;
    var time = this.attributesManager.getTimeSignature();
    for(var i = 0; i < this.notesList.length; i++) {
        var staff = this.staffList[i];
        stave = staves[staff - 1];

        var notes = this.notesList[i];
        var voice = new Vex.Flow.Voice({ num_beats: time['beats'],
                                        beat_value: time['beat-type'],
                                        resolution: Vex.Flow.RESOLUTION});
        voice.setMode(Vex.Flow.Voice.Mode.SOFT);
        voice = voice.addTickables(notes);
        voices.push([voice, stave]);
        if(preStaff != staff) {
            var formatter = new Vex.Flow.Formatter();
            formatter.joinVoices(staffVoices);
            formatter.formatToStave(staffVoices, stave);
            staffVoices = [voice];
        }
        else {
            staffVoices.push(voice);
        }
    }

    var formatter = new Vex.Flow.Formatter();
    formatter.joinVoices(staffVoices);
    formatter.formatToStave(staffVoices, stave);

    return voices;
};


// static functions

/**
 * @param {number} duration
 * @param {number} divisions
 * @param {boolean=} withDots
 */
Concerto.Parser.NoteManager.getStaveNoteTypeFromDuration = function(duration, divisions, withDots) {
    if(withDots == undefined) {
        withDots = false;
    }

    var i = Concerto.Table.NOTE_VEX_QUARTER_INDEX;
    for(var count = 0; count < 20; count++) {
        var num = Math.floor(duration / divisions);
        if(num == 1) {
            break;
        }
        else if(num > 1) {
            divisions *= 2;
            i++;
        }
        else {
            divisions /= 2;
            i--;
        }
    }
    if(count == 20) {
        Concerto.logError('No proper StaveNote type');
    }

    var noteType = Concerto.Table.NOTE_VEX_TYPES[i];
    if(withDots) {
        for(var count = 0; count < 5; count++) {
            duration -= Math.floor(duration / divisions);
            divisions /= 2;
            var num = Math.floor(duration / divisions);
            if(num == 1) {
                noteType += 'd';
            }
            else {
                break;
            }
        }
    }

    return noteType;
}

/**
 * @param {Array.<Object>} notes
 * @param {string} clef
 * @param {number} divisions
 */
Concerto.Parser.NoteManager.getStaveNote = function(notes, clef, divisions) {    
    var keys = [];
    var accidentals = [];
    var baseNote = notes[0];
    var duration;
    if(baseNote['type'] != undefined) {
        duration = Concerto.Table.NOTE_TYPE_DICT[baseNote['type']];
    }
    else {
        duration = Concerto.Parser.NoteManager.getStaveNoteTypeFromDuration(baseNote['duration'], divisions);
    }
    
    if(notes.length == 1 && baseNote['rest']) {
        duration += 'r';
        keys.push( Concerto.Table.DEFAULT_REST_PITCH );
        clef = undefined;
    }
    else {
        // compute keys 
        for(var i = 0; i < notes.length; i++) {
            var note = notes[i];
            var key = note['pitch']['step'].toLowerCase();
            if(note['accidental']) {
                var accidental = Concerto.Table.ACCIDENTAL_DICT[ note['accidental'] ];
                key += accidental;
                accidentals.push(accidental);
            }
            else {
                accidentals.push(false);
            }
            key += "/" + note['pitch']['octave'];
            keys.push(key);
        }
    }

    if(baseNote['dot']) {
        for(var i = 0; i < baseNote['dot']; i++) {
            duration += 'd';
        }
    }
    
    var staveNote = new Vex.Flow.StaveNote({ keys: keys, duration: duration, clef: clef });

    for(var i = 0; i < accidentals.length; i++) {
        if(accidentals[i]) {
            staveNote.addAccidental(i, new Vex.Flow.Accidental( accidentals[i] ));
        }
    }

    if(baseNote['dot']) {
        for(var i = 0; i < baseNote['dot']; i++) {
            staveNote.addDotToAll();
        }
    }

    if(baseNote['stem'] == 'up') {
        staveNote.setStemDirection(Vex.Flow.StaveNote.STEM_DOWN);
    }
                
    return staveNote;
};





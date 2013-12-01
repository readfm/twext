/**
* Game class handles all game features.
* On the user first tap while text is playing, the next played segment is set as "cue" of the game and game is started.
* while text is still playing, user start tapping segments trying to be close of perfect timings (saved ones) to get the best score.
* If user tap a segment in a time between +/- the master range, then gets Master score, else gets Good.
* If the user miss 3 segments without tapping, then game is stopped and total score is shown for some time, within this time user cannot start a new game. After score disappear, user can start new game and get another score.
* Game and player are working together.
*/
Game = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(player) {
    this.keys = { // tap keys
      'q': 81,
      'w': 87,
      'e': 69,
      'r': 82,
      't': 84,
      'y': 89,
      'u': 85,
      'i': 73,
      'o': 79,
      'p': 80
    };
    this.player = player; // player object
    this.currentSeg = false;  // the current seg in game(either highlighted or missed in play)
    this.on = false;  // game playing detection, true if the game is started
    this.segState = null; // segment state (cue, master, good)
    this.MASTER_RANGE = 0.3;  // master score range
    this.missedSegs = 0;  // missed segs count
    this.tappedSegs = []; // segments that have been tapped
    this.lastTapped = null; // last tapped seg
    this.scoreTimeout = null; // timeout for score display
    this.totalScore = 0;  // total score of all segments(sum of absolute value of difference between tapTime and perfectTime)
    this.scorePending = false;  // true when total score is shown till it disappear
  },

  /**
  * Start play game.
  */
  play: function() {
    if(!this.player.isPlaying() || this.scorePending) return;//game can't be started if text isn't playing or score is shown and not yet disappeared

    this.on = true; // set status of the game to on
    var tapTime = this.getTapTime(); // get time of the tap
    if(tapTime == -1) return; // no media(video/audio) is set

    var nextSeg = this.player.getNextSeg(this.currentSeg); // get next segment in game
    nextSeg = nextSeg?nextSeg:{line: 0, seg: 0}; // if no next seg, then use first seg
    if(!this.segState) { // no cue yet, set cue seg
      this.segState = "cue";  // set current state to cue
      this.player.unhighlightSeg(); // unhighlight current played segment
      this.player.highlightSeg(nextSeg, this.segState); // highlight cue seg
    } else {  // tap seg
      var perfectTime = this.player.getTiming(nextSeg); // get perfect timing of the seg
      var score = this.calculateSegScore(tapTime, perfectTime);  // calculate score
      this.segState = score;  // set current state to the segment score
      if(score == "master") this.player.unhighlightSeg(); // master segment cannot be shown with played seg, unhighlight currentSeg

      // unhighlight last tapped seg if it's not in play
      if(this.lastTapped && $('#'+this.lastTapped.line+""+this.lastTapped.seg).attr('class') != "gamePlayHighlighted") this.player.unhighlightSeg(this.lastTapped);

      // unhighlight next seg to rehighlight it with tap score
      this.player.unhighlightSeg(nextSeg);

      // highlight new tapped seg
      this.player.highlightSeg(nextSeg, this.segState);
    }
    this.currentSeg = nextSeg;  // set current seg to new tapped seg
    this.lastTapped = nextSeg;  // set last tapped segment
    this.tappedSegs.push(nextSeg); // push new tapped seg
    this.showSegTimeLabel(floatToStr(tapTime), "timeOn");  // show current tap time
    this.missedSegs = 0;  // reset missed segs when tap is done
  },

  /**
  * Get the time of the tap.
  * @return the current time of video/audio If there is a media set, else return -1
  */
  getTapTime: function() {
    if(this.player.media) return round(this.player.media.currentTime());  // return current time of the media
    return -1;  // no video/audio set, return -1
  },

  /**
  * Calculate segment score.
  * If difference between tap time and perfect time is within the range of Master, then it's a Master score, else it's a good score.
  * Total score of tapped segments is the sum of all segments scores(absolute difference between tap time and perfect time).
  */
  calculateSegScore: function(tapTiming, perfectTiming) {
    var scoreStr = "";
    var score = Math.abs(round(perfectTiming - tapTiming)); // difference between perfectTime and tapTime

    if(score >= 0 && score < this.MASTER_RANGE) { // score withing (-/+)Master_Range
      scoreStr = 'master';
    } else {  // good score
      scoreStr = 'good';
    }

    this.totalScore += score; // add current score
    return scoreStr;  // return score string
  },

  /**
  * Set seg time with the given css class and display.
  * @param 'value' time of tapped/played seg
           'clazz' css class
  */
  showSegTimeLabel: function(value, clazz) {
    $('#game-segTime-label').html(value); // set value
    var old = $('#game-segTime-label').attr("class"); // old class
    $('#game-segTime-label').removeClass(old);  // remove old class
    $('#game-segTime-label').addClass(clazz); // set new class
    $('#game-segTime-label').show();  // show label
  },

  /**
  * Check if the segment is not tapped. If segment is missed then add it to missedSegs count.
  * The check of lastTapped segment is for the case of last segment of text. Loop reset tappedSegs object, if the last seg is tapped, at the first seg play, when the check of missed previous segment, previous seg will not be found in tappedSegs (cos it's empty) but it equals to lastTapped seg.
  * @param 'segment'
  */
  countIfMissedSeg: function(segment) {
    if(!segment) return;  // no segment to check
    for(var i=0; i<this.tappedSegs.length; i++) {
      if(this.tappedSegs[i].line == segment.line && this.tappedSegs[i].seg == segment.seg) return;  // segment is tapped
    }

    // If segment is not the last tapped and not in tappedSegs, then count as missed
    //if(segment.line != this.lastTapped.line && segment.seg != this.lastTapped.seg) {
    this.missedSegs++;  // segment not tapped, add to count
    console.log("Missed: "+ this.missedSegs);
    this.currentSeg = segment;  // set the current seg to the missed seg
    //}
  },

  /**
  * Check if game is on.
  * @return true if game is on, false if not
  */
  isOn: function() {
    return this.on;
  },

  /**
  * Display score for after 1 second, keep displaying for 5 seconds then hide.
  */
  showScore: function() {
    if(this.totalScore == 0) return;  // no score to display

    var game = this;  // instance of this
    $('#game-score-label').html(round(this.totalScore));  // set label value
    this.scorePending = true; // score display in progress
    this.scoreTimeout = setTimeout(function(){game.displayScore();}, 1000); // show score after 1 second
  },

  /**
  * Display score for 5 seconds.
  */
  displayScore: function() {
    var game = this; // instance of this
    $('#game-score-label').show();  // show score
    clearTimeout(this.scoreTimeout); // clear score timeout
    this.scoreTimeout = setTimeout(function(){game.hideScore();}, 5000);  // hide score after 5 seconds
  },

  /**
  * Hide score.
  */
  hideScore: function() {
    $('#game-score-label').hide();  // hide score
    clearTimeout(this.scoreTimeout); // clear score timeout
    this.scorePending = false;
  },

  /**
  * Reset game data.
  */
  reset: function() {
    this.currentSeg = false;
    this.on = false;
    this.segState = null;
    this.missedSegs = 0;
    this.tappedSegs = [];
    this.lastTapped = null;
    this.scoreTimeout = null;
    this.totalScore = 0;
    this.scorePending = false;
  }  
});
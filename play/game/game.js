/**
* Game class handles all game features, this class works with player (text, audio, video) class.
*/
Game = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(el) {
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
    this.currentSeg = false;  // the cue seg number
    this.on = false;  // start game
    this.scores = [];
    this.segState = null;
    this.feedbackState = null;
    this.feedback = false;
    this.missedSegs = 0;
    this.tappedSegs = [];
    this.outOfRangeTiming = 0.71; // greater than 0.3
    this.timeouts = {};
    this.totalScore = 0;
    this.scorePending = false;
  },

  play: function() {
    if(this.scorePending) return;
    this.on = true; // set status of the game to on
    var tapTime = this.getTapTime();
    if(tapTime == -1) return; // this check will be unnecessary after implementing the last case in getCurerntTime

    //var currentSeg = player.getCurrentSeg();
    var nextSeg = player.getNextSeg(this.currentSeg);

    if(!this.segState) { // set cue
      this.segState = "cue";
      player.unhighlightSeg();
      player.highlightSeg(nextSeg, this.segState);
    } else {  // tap
      var perfectTiming = player.getNextSegTiming(this.currentSeg);
      var score = this.calculateSegScore(tapTime, perfectTiming);//console.log("GAME: "+nextSeg.line+""+nextSeg.seg+"   "+tapTime+"   "+score);
      if(!score) return;
      if(score == "master") player.unhighlightSeg();
      this.segState = score;

      //unhighlight last tapped seg if it's not equal to the current seg
      var lastTapped = this.tappedSegs[this.tappedSegs.length-1];
      if(lastTapped && (lastTapped.line != this.currentSeg.line || lastTapped.seg != this.currentSeg.seg)) player.unhighlightSeg(lastTapped);

      var segSpan = $('#'+this.currentSeg.line+""+this.currentSeg.seg);
      if(segSpan && segSpan.attr('class') != "play") {  // if old tapped seg is not in play, unhighlight to highlight the new tapped seg
        player.unhighlightSeg(this.currentSeg);
      }
      segSpan = $('#'+nextSeg.line+""+nextSeg.seg);
      // if new tapped seg is in play, unhighlight to rehighlight it with the "tapped" class
      if(segSpan) {
        player.unhighlightSeg(nextSeg);
      }
      player.highlightSeg(nextSeg, this.segState);
      this.tappedSegs.push(nextSeg);
    }
    this.currentSeg = nextSeg;
    this.setSegTimeLabel(floatToStr(tapTime), "timeOn");
    this.missedSegs = 0;
  },

  calculateSegScore: function(currentTiming, perfectTiming) {
    var scoreStr = "";
    var score = round(perfectTiming - currentTiming);console.log("SCORE: "+score);
    if((score < 0 && score > -0.3) || (score >= 0 && score < 0.3)) { // master
      scoreStr = 'master';
      this.scores.push(100);
    } else if((score <= -0.3 && score > -0.5) || (score >= 0.3 && score < 0.5)) { // good
      scoreStr = 'good';
      this.scores.push(80);
    } else if((score < -0.5) || (score >= 0.5)) {
      scoreStr = 'good';
      this.scores.push(50);
    }
    this.totalScore += Math.abs(score);
    return scoreStr;
  },

  checkIfMissedSeg: function(segment) {
    //clearTimeout(this.timeouts[segment.line+""+segment.seg]);
    //delete this.timeouts[segment.line+""+segment.seg];
    if(!segment) return;
    for(var i=0; i<this.tappedSegs.length; i++) {
      if(this.tappedSegs[i].line == segment.line && this.tappedSegs[i].seg == segment.seg) return;
    }
    this.missedSegs++;
    this.currentSeg = segment;
  },

  showSegTimeLabel: function() {
    $('#game-segTime-label').show();
  },

  setSegTimeLabel: function(value, clazz) {
    $('#game-segTime-label').html(value);
    var old = $('#game-segTime-label').attr("class");
    $('#game-segTime-label').removeClass(old);
    $('#game-segTime-label').addClass(clazz);
  },

  getTapTime: function() {
    var time = -1;
    if(videoPlayer.videoSet()) {  // get time from video
      time = round(videoPlayer.currentTime());
    } else if(twextRecorder.audioDuration() != -1) {  // get time from audio
      time = round(twextRecorder.audioCurrentTime());
    } else {  // get time from date
      console.log("not yet");
    }
    return time;
  },

  isOn: function() {
    return this.on;
  },

  calculateFeedback: function() {
    var sum = 0, i, avg = 0, feedback = "";
    for(i=0; i<this.scores.length; i++) {
      sum += this.scores[i];
    }
    avg = sum/this.scores.length;console.log("FEEDBACK: "+avg);
    if(avg >= 50 && avg < 80) {
      feedback = "oof";
    } else if(avg >= 80 && avg < 100) {
      feedback = "good"
    } else if(avg == 100) {
      feedback = "master";
    }
    this.feedback = feedback;
  },

  showFeedback: function() {
    var old;
    if(!this.feedbackState) return;
    if(!this.feedback)  this.calculateFeedback();
    $('#game-feedback-label').html(this.feedback);
    if(this.feedbackState == "ready") { // not yet shown
      old = $('#game-feedback-label').attr("class");
      $('#game-feedback-label').removeClass(old);
      $('#game-feedback-label').addClass("feedbackOn");
      $('#game-feedback-label').show();
      this.feedbackState = "on";
    } else if(this.feedbackState == "on") {
      old = $('#game-feedback-label').attr("class");
      $('#game-feedback-label').removeClass(old);
      $('#game-feedback-label').addClass("feedbackFade1");
      this.feedbackState = "fade1";
    } else if(this.feedbackState == "fade1") {
      old = $('#game-feedback-label').attr("class");
      $('#game-feedback-label').removeClass(old);
      $('#game-feedback-label').addClass("feedbackFade2");
      this.feedbackState = "fade2";
    } else if(this.feedbackState == "fade2") {
      old = $('#game-feedback-label').attr("class");
      $('#game-feedback-label').removeClass(old);
      $('#game-feedback-label').addClass("feedbackFade3");
      this.feedbackState = "fade3";
    } else if(this.feedbackState == "fade3") {
      old = $('#game-feedback-label').attr("class");
      $('#game-feedback-label').removeClass(old);
      $('#game-feedback-label').addClass("feedbackFade3");
      this.feedbackState = "fade4";
    } else if(this.feedbackState == "fade4") {
      $('#game-feedback-label').hide();
      this.resetFeedback();
    }
    
  },

  showScore: function() {
    if(this.totalScore == 0) return;
    $('#game-feedback-label').html(round(this.totalScore));
    this.scorePending = true;
    this.timeouts['score'] = setTimeout(function(){game.displayScore();}, 1000);
    //$('#game-feedback-label').show();
  },
  displayScore: function() {
    $('#game-feedback-label').show();
    clearTimeout(this.timeouts['score']);
    this.timeouts['score'] = setTimeout(function(){game.hideScore();}, 5000);
  },
  hideScore: function() {
    $('#game-feedback-label').hide();
    clearTimeout(this.timeouts['score']);
    delete this.timeouts['score'];
    this.scorePending = false;
  },

  setFeedbackState: function(state) {
    this.feedbackState = state;
  },

  resetFeedback: function() {
    this.feedbackState = null;
    this.feedback = false;
  },

  reset: function() {
    this.currentSeg = false;
    this.on = false;
    this.segState = null;
    this.scores = [];
    this.missedSegs = 0;
    this.tappedSegs = [];
    this.totalScore = 0;
  }
});
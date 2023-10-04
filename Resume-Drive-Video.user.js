// ==UserScript==
// @name        Resume Drive Video
// @description A userscript that remembers the playback position for Google Drive videos and asks if you want to resume from where you left off.
// @version     1.0.0
// @icon        https://repository-images.githubusercontent.com/700134394/f0dedbe2-036b-4993-b4f9-1c9e60c597f7
// @updateURL   https://raw.githubusercontent.com/Oshanotter/Resume-Drive-Video/main/Resume-Drive-Video.user.js
// @namespace   Oshanotter
// @author      Max Forst
// @match       https://drive.google.com/file/d/*
// @match       https://youtube.googleapis.com/embed/*
// @run-at document-end
// ==/UserScript==

function main(){
  if (window.location.href.includes("https://drive.google.com/file/d/")){
    // main Google Drive file page, execute topPage() function
    //alert("drive")
    topPage()
  }else{
    // embedded YouTube page with the video file, execute embeddedPage() function
    //alert("youtube")
    embeddedPage()
  }
}


function topPage(){
  function checkCookie(){
    // check the cookie for playback position and ask to resume playing from position
    var cookie = document.cookie.match('playbackPosition=([^;]+)');
    var playbackPosition = cookie[0]
    var position = parseFloat(cookie[1]);
    if (position > 0){
      // ask the user if they want to resume from where they left off
      var resume = window.confirm("Resume from where you left off?\n\n"+formatTime(position));
      if (resume){
        // message the embedded page to change the playback position; resume the video from where we left off
         var iframe = document.querySelector("#drive-viewer-video-player-object-0")
        iframe.contentWindow.postMessage(playbackPosition, 'https://youtube.googleapis.com/embed/*');

      }else{
        // the video will start over; reset the cookie for next time
        document.cookie = "playbackPosition=0"
      }
    }
  }

  function formatTime(seconds) {
    // convert the time position into a nice string for easy reading
    if (isNaN(seconds) || seconds < 0) {
      return 'Invalid input';
    }

    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsFinal = Math.floor(remainingSeconds % 60);

    let formattedTime = '';

    if (hours > 0) {
      formattedTime += `${hours}h`;
      formattedTime += ` ${minutes.toString().padStart(2, '0')}m`;
     } else if (minutes > 0) {
      formattedTime += `${minutes}m`;
      formattedTime += ` ${remainingSecondsFinal.toString().padStart(2, '0')}s`;
    } else {
      formattedTime += `${remainingSecondsFinal}s`;
    }
    return formattedTime;
  }


  // listen for the message from the embedded page, then set the cookie
  window.addEventListener('message', event => {
    // Access event data in event.data
    receivedData = event.data;
    if (receivedData.includes("playbackPosition=")){
      // set a cookie to the current playback position; for example, playbackPosition=120.45
      document.cookie = receivedData
    }else if (receivedData == "checkCookie"){
      // check the cookie for playback position and ask the user if they want to resume the video
      checkCookie()
    }

  });
}

function embeddedPage(){
  // add a listener for when the user starts the video for the first time
  var isPlaying = false
  var vid = document.querySelector('video')
  vid.addEventListener("play", function() {
    if (isPlaying == false){
      // send the message "checkCookie" to the top page to activate the checkCookie() function
      window.parent.postMessage("checkCookie", 'https://drive.google.com/file/d/*');
      isPlaying = true
    }
  });

  // find the video and send the top page its current position every 15 seconds
  setInterval(function() {
    var position = document.querySelector('video').currentTime;
    if (position == 0){return}
    window.parent.postMessage("playbackPosition="+position, 'https://drive.google.com/file/d/*');
  }, 15000);

  // listen for a message from the top page, then set the playback position to the cookie's value
  window.addEventListener('message', event => {
    // Access event data in event.data
    receivedData = event.data;
    if (receivedData.includes("playbackPosition=")){
      var time = receivedData.replace("playbackPosition=", "");
      var time = parseFloat(time);
      var vid = document.querySelector('video')
      vid.currentTime = time
    }

  });
}


main()



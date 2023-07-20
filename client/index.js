let oSipSessionRegister, oSipSessionCall;
let sipStack;
let db;

$(document).ready(function () {
  const dbName = "sipClientDB";
  const storeName = "sipUserInfo";

  // Initialize the IndexedDB
  let openRequest = indexedDB.open(dbName, 1);

  openRequest.onupgradeneeded = function (e) {
    db = e.target.result;
    let store = db.createObjectStore(storeName, { keyPath: "id" });
    store.createIndex("username", "username", { unique: false });
    store.createIndex("password", "password", { unique: false });
  };

  openRequest.onsuccess = function (e) {
    db = e.target.result;

    // Get data
    let tx = db.transaction(storeName, "readonly");
    let store = tx.objectStore(storeName);
    let req = store.get(1);

    req.onsuccess = function (e) {
      let record = e.target.result;
      if (record) {
        $("#username").val(record.username);
        $("#password").val(record.password);
      }
    };

    req.onerror = function (e) {
      console.log("Error getting record", e);
    };
  };

  openRequest.onerror = function (e) {
    console.log("Error opening db", e);
  };
});

// Callback function for SIPml.Stack
function onSipEvent(e) {
  console.log("SIP event: " + e.type);

  if (e.type === "started") {
    oSipSessionRegister = this.newSession("register", {
      expires: 200,
      events_listener: { events: "*", listener: onSipEventSession },
    });
    oSipSessionRegister.register();
  } else if (e.type === "i_new_call") {
    if (oSipSessionCall) {
      // If there's an existing call, reject the incoming call.
      e.newSession.hangup();
    } else {
      // Do not accept the call yet, just show the 'accept' and 'decline' buttons.
      oSipSessionCall = e.newSession;

      // set sipEventSessionListener
      oSipSessionCall.setConfiguration({
        events_listener: { events: "*", listener: onSipEventSession },
      });

      // Play ringing sound
      document.getElementById("ringing-sound").play();

      // Show incoming call screen
      $("#dialing-screen").hide();
      $("#incoming-call-screen").show();

      // Show caller name
      $("#incoming-caller-name").text(
        "From " + e.newSession.getRemoteFriendlyName()
      );
    }
  }
}

// Callback function for SIPml.Session
function onSipEventSession(e) {
  console.log("SIP session event: " + e.type);
  if (e.request) {
    console.log("method: " + e.request.method); // for debug. delete later
  }

  if (e.type === "connected" && e.session === oSipSessionRegister) {
    // Successfully registered

    // Show dialing screen
    $("#register-screen").hide();
    $("#dialing-screen").show();
  } else if (e.type === "terminated" && e.session === oSipSessionRegister) {
    // Registration failed or was unregistered

    // Show register screen
    $("#register-screen").show();
    $("#dialing-screen, #calling-screen, #incoming-call-screen").hide();
  } else if (e.type === "connected" && e.session === oSipSessionCall) {
    // Call connected

    // Stop ringing sound
    document.getElementById("ringing-sound").pause();

    // Show incall screen
    $("#dialing-screen, #incoming-call-screen, #calling-screen").hide();
    $("#incall-screen").show();

    // Show caller name
    $("#incall-caller-name").text(
      "In call with " + e.session.getRemoteFriendlyName()
    );
  } else if (e.type === "terminated" && e.session === oSipSessionCall) {
    // Call ended
    oSipSessionCall = null;

    // Stop ringing sound
    document.getElementById("ringing-sound").pause();

    // Show dialing screen
    $("#dialing-hangup-button").hide();
    $("#calling-screen, #incall-screen, #incoming-call-screen").hide();
    $("#dialing-screen").show();
  }
}

$("#register-form").on("submit", function (e) {
  e.preventDefault();

  const username = $("#username").val();
  const password = $("#password").val();

  // Store data
  let tx = db.transaction("sipUserInfo", "readwrite");
  let store = tx.objectStore("sipUserInfo");

  store.put({ id: 1, username: username, password: password });

  tx.oncomplete = function () {
    console.log("Stored data!");
  };

  tx.onerror = function (e) {
    console.log("Error storing data", e);
  };

  // Create SIP stack
  const serverIp = "192.168.0.1";
  sipStack = new SIPml.Stack({
    realm: serverIp, // your realm
    impi: username,
    impu: "sip:" + username + "@" + serverIp, // your SIP URI
    password: password, // your password
    display_name: username, // your display name
    websocket_proxy_url: "ws://" + serverIp + ":8088/ws", // your websocket proxy URL
    ice_servers: [{ url: "stun:stun.l.google.com:19302" }], // STUN/TURN servers array
    enable_rtcweb_breaker: false, // enable RTCWeb Breaker
    enable_media_stream_cache: false,
    enable_early_ims: false,
    events_listener: { events: "*", listener: onSipEvent }, // events listener
  });

  sipStack.start();
});

$("#dialing-form").on("submit", function (e) {
  e.preventDefault();

  const number = $("#number").val();

  if (sipStack && !oSipSessionCall) {
    oSipSessionCall = sipStack.newSession("call-audio", {
      audio_remote: document.getElementById("audio_remote"),
      events_listener: { events: "*", listener: onSipEventSession },
    });
    oSipSessionCall.call(number);

    // show calling screen
    $("#dialing-screen").hide();
    $("#calling-screen").show();
  }
});

$("#accept-button").on("click", function (e) {
  e.preventDefault();

  if (oSipSessionCall) {
    oSipSessionCall.accept({
      audio_remote: document.getElementById("audio_remote"),
      events_listener: { events: "*", listener: onSipEventSession },
    });
  }
});

$("#incall-hangup-button").on("click", function (e) {
  e.preventDefault();

  if (oSipSessionCall) {
    oSipSessionCall.hangup();
  }
});

$("#decline-button, #calling-cancel-button").on("click", function (e) {
  e.preventDefault();

  if (oSipSessionCall) {
    oSipSessionCall.hangup();
  }
});

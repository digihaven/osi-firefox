// var osi = require("osi.js");
// osi.loadConfig();

var data = require("sdk/self").data;

var osi_panel = require("sdk/panel").Panel({
  width: 240,
  height: 320,
  contentURL: data.url("html/popup-light.html"),
  contentScriptFile: [data.url("js/jquery.min.js"),
		      data.url("js/jquery.storageapi.min.js"),
		      data.url("js/socket.io.js"),
		      data.url("js/osi.js"),
                      data.url("js/panel.js"),
                      data.url("js/popup.js")]
});

osi_panel.port.on("click", function(url) {
  require("sdk/tabs").open(url);
});

require("sdk/widget").Widget({
  id: "open-osi-btn",
  label: "osi",
  contentURL: data.url("images/icon128.png"),
  panel: osi_panel
});

exports.main = function(options, callbacks) {
  // If you run cfx with --static-args='{"quitWhenDone":true}' this program
  // will automatically quit Firefox when it's done.
  if (options.staticArgs.quitWhenDone)
    callbacks.quit();
};


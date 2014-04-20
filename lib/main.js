var data = require("sdk/self").data;

var osi_panel = require("sdk/panel").Panel({
  width: 240,
  height: 320,
  contentURL: "https://s3.amazonaws.com/opensearchindex/mobile.html",
  contentScriptFile: [data.url("jquery-1.4.4.min.js"),
                      data.url("panel.js")]
});

osi_panel.port.on("click", function(url) {
  require("sdk/tabs").open(url);
});

require("sdk/widget").Widget({
  id: "open-osi-btn",
  label: "osi",
  contentURL: "https://s3.amazonaws.com/opensearchindex/favicon.ico",
  panel: osi_panel
});

exports.main = function(options, callbacks) {
  // If you run cfx with --static-args='{"quitWhenDone":true}' this program
  // will automatically quit Firefox when it's done.
  if (options.staticArgs.quitWhenDone)
    callbacks.quit();
};
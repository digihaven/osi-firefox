// This is a content script.  It executes inside the context of the osi page
// loaded into the panel and has access to that page's window object and other
// global objects (although the page does not have access to globals defined by
// this script unless they are explicitly attached to the window object).
//
// This content script is injected into the context of the osi page
// by the Panel API, which is accessed by the main add-on script in lib/main.js.
// See that script for more information about how the panel is created.

osi.loadConfig();

if (typeof $ === 'undefined' && typeof require === 'function')
{
	var $ = cheerio = require('cheerio');

	cheerio.ajax=function(settings){
		var request = require('request');
		request({url:settings.url, json:settings.dataType==="json"}, function (error, response, data) {

			/*
				@bugfix typeof response=="undefined"
				Fixes this error:
				>> ajax.error { [Error: connect ENETUNREACH] code: 'ENETUNREACH', errno: 'ENETUNREACH', syscall: 'connect' }
				>> TypeError: Cannot read property 'statusCode' of undefined
			*/
			if (error || typeof response=="undefined")
			{
				if (typeof settings.error === "function")
					settings.error(null,error,"");
				else
					return;
			}

			if (response.statusCode == 200) {
				if (typeof settings.error === "function")
					settings.success(data,response,null);
			} else {
				if (typeof settings.error === "function")
					settings.error(null,response,"");
				else
					return;
			}
		})
	};
}

if (typeof io === 'undefined' && typeof require === 'function')
	var io = require('socket.io-client');

(function(exports){
	var seeds=null;
	var server=null;

	exports.modules={
		core:
		{
			setPoints: function (points) {
				$.localStorage.set("points",parseFloat(points));
			},

			getGuid: function (func) {
				func(null,$.localStorage.get("guid"));
			},

			hashImage: function (urls,func) {
				var locks=0;
				var hashes=[];

				urls.forEach(function(url)
				{
					var start=new Date();

					img = new Image();

					locks++;
					img.onerror=function(evt){
						hashes.push({url:img.src,time:(new Date() - start),err:true});

						locks--;
						if (locks==0)
							func(null,hashes);
					};
					img.onload = function(){
				
						// image  has been loaded
						var canvas = document.createElement("canvas");
						canvas.width = 32;
						canvas.height = 32;

						// Copy the image contents to the canvas
						var ctx = canvas.getContext("2d");
						ctx.drawImage(this, 0, 0,this.width,this.height,0,0,32,32);

						var imageData = ctx.getImageData(0, 0, 32,32);
						var data = imageData.data;

						var hash=0;
						for(var i = 0; i < data.length; i += 4) {
							var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
							// red
							data[i] = brightness;
							// green
							data[i + 1] = brightness;
							// blue
							data[i + 2] = brightness;

							hash=brightness;
						}
						ctx.putImageData(imageData, 0, 0);

						hashes.push({url:img.src,time:(new Date() - start),ph_dct_imagehash:hash,image_md5:"",width:src.width,height:src.height});

						locks--;
						if (locks==0)
							func(null,hashes);
					};

					img.src = url;//"https://upload.wikimedia.org/wikipedia/commons/5/5f/Peacekeeper-missile-testing.jpg";
				});
			},
		}
	};


	exports.localStorageGet=function(n,def)
	{
		if (!$.localStorage.isSet(n))
			$.localStorage.set(n,def);

		return $.localStorage.get(n);
	};

	exports.guid=function() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
			       .toString(16)
			       .substring(1);
		  }
		  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			 s4() + '-' + s4() + s4() + s4();
	};

	var serverLoaded=false;
	exports.listen=function(){
		if (serverLoaded)
			return;

		if (typeof require === 'function')
		{
			var mysettings={"host":"","portraw":10846,"portwebsocket":10847,"secure":1};

			console.log("Listening on port",mysettings.portwebsocket);

			var socketio = require('socket.io');

			function stage2(io)
			{
				console.log("Listening stage2",mysettings.portwebsocket);
				io.sockets.on('connection', function (socket) {
					var address = socket.handshake.address;

					var geo = null;
					try {
						var geoip = require('geoip-lite');
						geo = geoip.lookup(address.address);
					} catch(e) {
					}

			
					if (geo==null)
						geo = { range: [ 0, 0 ],
							country: 'unknowen',
							region: 'unknowen',
							city: 'unknowen',
							ll: [0, 0] };

					console.log("New connection from " + address.address + ":" + address.port, geo.city, geo.country, geo.country);

					socket.on('disconnect', function () {
						console.log('User disconnected ' + address.address + ":" + address.port);
					});
				});
			}
			if (mysettings.secure)
			{
				// Load libraries
				var https = require('https');
				var fs = require('fs');

				ca = [];
	
				//fs.readdir("../certs/ca", function(err,files){
				//	if (err)
				//		return console.error(err);

					/**/
					var ca=fs.readFileSync( '../certs/bundle.crt').toString().split("-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----");

					// Split the bundel so it is compatible (a full chain) 
					for (var i=0; i<ca.length; i++)
					{
						if (i!=0)
							ca[i]="-----BEGIN CERTIFICATE-----" + ca[i];

						if (i!=ca.length-1)
							ca[i]=ca[i] + "-----END CERTIFICATE-----";
					}

					var svrOptions = {
					    key: fs.readFileSync('../certs/server.key'),
					    cert: fs.readFileSync('../certs/server.crt'),
					    ca: ca
					};


					 
					// Create a Basic server and response 
					var servidor = https.createServer( svrOptions , function( req , res ){
					    res.writeHead(200);
					    res.end('Hi! Code here...');
					});
					 
					// Create the Socket.io Server over the HTTPS Server
					var io = socketio.listen( servidor , { log: false });
					 
					// Now listen in the specified Port
					servidor.listen( mysettings.portwebsocket );

					stage2(io);
				//});
			}
			else
			{
				stage2(socketio.listen(mysettings.portwebsocket, { log: false }));
			}

			serverLoaded=true;
		}
	}

	exports.loadConfig=function()
	{
		exports.listen();

		console.log("Fetching seeds");
		$.ajax({
		  dataType: "json",
		  url: "https://s3.amazonaws.com/opensearchindex/seeds.json", // <<-- Notice HTTPS. The way everything needs to be. :)
		  success: function(data, textStatus, jqXHR){
			seeds=data;
			exports.startup();
		  },
		  error: function(jqXHR, textStatus, errorThrown){
			console.log("ajax.error",textStatus);
			exports.disconnect();
			setTimeout(function(){
				exports.loadConfig(); // Try again....
			},10000);
		  }
		})
	};

	exports.startup=function()
	{
		if (!seeds)
			return console.error("Startup: No seeds list available!");
		if (Object.prototype.toString.call(seeds) !== '[object Object]')
			return console.error("Startup: seeds list is worng type!");
		if (Object.prototype.toString.call(seeds.servers) !== '[object Array]')
			return console.error("Startup: seeds list servers is worng type!");
		if (seeds.servers.length==0)
			return console.error("Startup: seeds list servers is empty!");

		var choice=0;

		// Chose one at random and weed it out
		while (seeds.servers.length)
		{
			choice=Math.floor(Math.random() * seeds.servers.length);

			if (Object.prototype.toString.call(seeds.servers[choice].portwebsocket) !== "[object Number]")
				delete seeds.servers.splice(choice, 1);
			else
				break;
		}
		       
		if (seeds.servers.length==0)
			return console.error("Startup: seeds list servers had no websocket server!");

		server=seeds.servers[choice];

		
		var address=(server.secure ? 'https' : 'http') + '://' + server.host + ':' + server.portwebsocket;
	
		console.log("Connecting to:", address);

		//var socket = io.connect(address,{
		var socket = io.connect('',{host:server.host,secure:server.secure,port:server.portwebsocket,query:"",
		'reconnect':false,
		'force new connection':true,
		});
		socket.on('connect', function() {
		  console.log('Connected', socket.socket.connected);
		});
		
		var restartLock=false;
		function restart()
		{
			if (restartLock)
				return;

			setTimeout(function(){
				exports.loadConfig(); // Try again....
			},10000);

			restartLock=true;
		}
		socket.on('disconnect', function (err) {
			console.error("Socket Disconnect",err);
			restart();
		});

		function isCallable(base,name,type)
		{
			if (typeof name==="string" && name.length!=0 && name[0] != "_" && typeof base[name]==type)
			{	
				return false;
			}

			return true;
		}

		// contract wraper, cuz we are lazy and don't wan't to bind every function.
		// @todo RFC:
		//	- Member Visibility:  Protected method, variable or class names start with a single underscore (_) and cannot be called.
		socket.on('contract', function (err,obj) {
			// By activating a module, you opt into using it 
			// For example: if you only want to take contactacts to spider webpages you only activate the webpage module. 
			// For things more advanced like: DNA cacluations you could optout of doing human DNA cacluation by telling that module to reject meta (too advanced for this area unless you just block DNA alltogether), 
				// same for rejecting pornographic sites that might get people a public wifi or a religious afterlife ban ( http://en.wikipedia.org/wiki/Nudity_in_religion ). 
			if (isCallable(exports.modules,obj.module,"object"))  
			{
				var module=exports.modules[obj.module];

				if (isCallable(module,obj.func,"function"))
				{
					var func=module[obj.func];

					// Am I TOO BUSY?
					// contract server sends obj.bid; // What are you offering?
					// exports.options.minbid // Is this ok with me?
					// how much would this set cost?
					// what's the risk? (such as 404)
					// Do I have time for this?
					// Contract server, has this contact been pre signed for me with payment hold?
					// Contract server, ok I sign the contact (before timeout).
					// Process
					// Hash data and send it to contract server. This is so it can be compaired to other contractors for consensus. :)
					// Contract sever should respond if ok.
					// If requested, Send data to contract server. ( expect to be paid extra for the sauce :D )
					// Then Contract sever should respond if ok. 
					// Get paid
					// ?????
					// Profit!
					// Or temp ban server and report to network if not paid within Good vs Bad payments ratio. This method is for high turn over flexibliy of fault on both sides (contactor vs contact server).					
					exports.modules[obj.module][obj.func].apply(exports.modules[obj.module],obj.args);
				}
			}
		});

		socket.on('error', function (err) {
			console.error("Socket Error",err);
			
			// Make sure we are dissconnected
			socket.disconnect();

			restart();
		});
	};
})(typeof exports === 'undefined'? this['osi']={}: exports);

$(function(){
	function update(){
		$(".points").text(osi.localStorageGet("points","0"));
		$(".guid").text(osi.localStorageGet("guid",osi.guid()));

		osi.get("connections_out", function(val) {
			$(".connections_out").text(val);
		});
	}
	setInterval(update,1000);


	update();
});

/*
 * todo: create two models for playlists:
 * 1)playlist with plugins/subplaylist info
 * 2)linearized, current playlist
 * alternatively, create id scheme for multi-level-playlists
 * 
 * todo: cleaner MVC separation
 * 
 * todo: evaluate setting z-index automatically to ensure being on top
 * 
 * todo: deal with frame-breakers
 * 
 * todo: write ORM and attach it via mutation events 
 * to live DOM nodes or JS Objects storing the app state
 * for incremental writing and optional synchronizing
 * 
 * todo: investigate anonymous function as namespace tool
 */




//class definitions
var mqItem = function(url, plugin, name) {
	this.url = url || "http://urlybits.com";
	this.plugin = plugin || "plain";
	this.name = name || mq.i18n("Not Set");
	
};


//init m-Qu namespace
mq = {};

//todo: define mapping between active playlist items and it's storage model
mq.buildPlaylist = function () {};

//todo: write plugin loader
//todo:write i18n system
mq.i18n = function(english) {
	return english;
};

mq.savePls = function (){ 
	//serialize playlists
	//use keynamemanager to generate individual keys to minimize save/restore time ?
	localStorage.setItem("playlists", JSON.stringify(mq.pl));
};

/*todo: design help system 
* probably use a parameter to manage lifetimes/-cycles
* build a sequential guide system a la game tutorials
* the guide system should support suspend/resume as well as "chunks" of topics, mapping
* to attention spans
* 
* todo: convert to jquery ui 1.9 tooltip
*/
mq.displayHelp = function(code, txt) {
	switch (code) {
	  case 0:
	    var helpbubble = document.body.appendChild(document.createElement("div"));
	    helpbubble.setAttribute("id", "help" + code.toString());
	    helpbubble.setAttribute("class", "mq_help mq_help0");
	    helpbubble.innerHTML = txt;
	    break;
	  default:
	    break;
	}
};

//todo: find a better name for this method
mq.setupState = function () {

	//todo: probably split this out for cleaner separation of concerns
	//create playlist
	if (!mq.pl) {
		mq.pl = new Array();
	}
	
	//check if playlist is empty or even set at all
	if (mq.pl.length == 0) {
		//if not display placeholder
		$("#mq_content").css("display", "none");
		$("#mq_placeholder").css("display", "block");
		
		//don't display the delete button if there is nothing to delete
		$("#mq_delete_current").css("display", "none");
		//same goes for the next button
		$("#mq_next").css("display", "none");
		
	} else {
		//todo: set this to use the new model abstraction
		if (document.getElementById('mq_content').src != mq.pl[mq.pl_item_active].url) {
			document.getElementById('mq_content').src = mq.pl[mq.pl_item_active].url;
		}
		$("#mq_placeholder").css("display", "none");
		$("#mq_content").css("display", "block");
		$("#mq_delete_current").css("display", "block");
		if(mq.pl.length > 1) {
			$("#mq_next").css("display", "block");
		} else {
			//in case we dropped back down to one item only
			$("#mq_next").css("display", "none");
		}
		
	};
};

//backbone models for saving
var mq_Item = Backbone.Model.extend({
	initialize  : {},
	  defaults: {
	    url: "http://www.m-qu.com",
	    plugin: "plain",
	    name: mq.i18n("Not Set")
	  }
	});

var mq_Items = Backbone.Collection.extend({
	  model: mq_Item
	});

//read storage
mq.pl = JSON.parse(localStorage.getItem("playlists"));

//mq.pl_active = "Default";
mq.pl_item_active = 0;

function ignoreEvent(e) {
	  e.originalEvent.stopPropagation();
	  e.originalEvent.preventDefault();
}

//on document ready
$(document).ready(function (e1) {
	//display first item
	mq.setupState();
	
	$("#mq_dock_extender1").bind("mouseover", function(e){
		//open dock stage 1
		$("#mq_dock").removeClass("mq_dock_minimized");
	});
	
	$("#mq_dock_extender2").bind("click", function(e) {
		//open dock stage 2
		$("#mq_dock").addClass("mq_dock_extended");
	});
	
	$("#mq_dock").bind("mouseout", function(e) {
		$("#mq_dock").removeClass("mq_dock_extended");
		$("#mq_dock").addClass("mq_dock_minimized");
	});
	
	$( "#mq_next" )
	.button()
			.click(function (e2){
				
			//todo: catch case of no more items, probably deactivate button until more items become available
			//todo: factor out this method,  possibly add to playlist class prototype, for reuse in deletion
			//wrap around 
			if (mq.pl_item_active + 1 >= mq.pl.length) {
				mq.pl_item_active = 0;
			} else {
				mq.pl_item_active++;
			}
			
			mq.setupState();
		});
	
	$("#mq_delete_current")
		.button()
		.click(function (e) {

			mq.pl.splice(mq.pl_item_active, 1);
		
			//todo: see $("#mq_next").click()
			//wrap around 
			if (mq.pl_item_active + 1 >= mq.pl.length) {
				mq.pl_item_active = 0;
			}
			
			mq.setupState();
			
			mq.savePls();
	});
	
	$("#mq_pl_manager").accordion({
		event: "mouseover"
	});
	
	
	
	
	//register event handlers
	//todo: check for opportunities to register event handlers earlier to improve perceived gui latency
	$(document).bind('dragenter',function(e2) { 
		ignoreEvent(e2);

		//todo: show only relevant drop area depending on placeholder visible or not
		//just in case the user is mouse-twitchy, prevent double execution
		if(!$("#mq_dock").hasClass("mq_droptarget")) {
			$("#mq_dock").addClass("mq_droptarget");
			
			//help code 0 = drag'n'drop info
			mq.displayHelp(0, mq.i18n("<-- Drop here to add to current playlist. Hover to open playlist manager for precise placement in queue."));
		};
		//just in case the user is mouse-twitchy, prevent double execution
		if(!$("#mq_main_column").hasClass("mq_droptarget")) {
			$("#mq_main_column").addClass("mq_droptarget");
			$("#mq_main_column").css("width", "60%");
		};
		
		//just in case the user is mouse-twitchy, prevent double execution
		if(!$("#mq_droptarget_previous").hasClass("mq_droptarget")) {
			$("#mq_droptarget_previous").addClass("mq_droptarget");
		};
		
		//just in case the user is mouse-twitchy, prevent double execution
		if(!$("#mq_droptarget_next").hasClass("mq_droptarget")) {
			$("#mq_droptarget_next").addClass("mq_droptarget");
		};
		
	});
	
	
	$("#mq_dock")
		.bind('dragenter', function(e2) { 
			ignoreEvent(e2);
			})
		.bind('dragover', function(e2) { 
			ignoreEvent(e2);			
			})
		.bind('drop', function (e2) {
			// stops the browser from redirecting off to the text.
			ignoreEvent(e2);
			
			//remove visual aides
			//todo: automate cleanup in the help system 
			$("#mq_dock").removeClass("mq_droptarget");
			$("#mq_placeholder").removeClass("mq_droptarget");
			$("#help0").remove();
			
			//todo: generalize this to cover the case of insertion before or after existing items
			if (mq.pl.length == 0) {
				//prepare for arbitrary placement of items(into the playlist(s))
				insert_item = mq.pl_item_active;
			} else {
				//prepare for arbitrary placement of items(into the playlist(s))
				insert_item = mq.pl_item_active + 1;
			}
			
		
			insert_item = mq.pl_item_active + 1; //position to insert or overwrite at
			delete_items = 0; //overwrite or simply remove items
			
			mq.pl.splice(	insert_item, 
							delete_items,
							new mqItem(event.dataTransfer.getData('Text'))
						);
			
			mq.setupState();
			
			mq.savePls();
			
			return false;
			});
	
	$("#mq_placeholder_add_url").bind("click", function(e2) {
		
		//todo: factor out code
		insert_item = mq.pl_item_active; //position to insert or overwrite at
		delete_items = 0; //overwrite or simply remove items
		
		mq.pl.splice(	insert_item, 
						delete_items,
						new mqItem($("#mq_placeholder_url").val())
					);
		
		mq.setupState();
		
		mq.savePls();
	});
	
	//register event handlers
	//todo: check for opportunities to register event handlers earlier to improve perceived gui latency
	$("#mq_placeholder")
	.bind("drop", function(e2) {
		ignoreEvent(e2);
		
		//remove visual aides
		//todo: automate cleanup in the help system 
		$("#mq_dock").removeClass("mq_droptarget");
		$("#mq_placeholder").removeClass("mq_droptarget");
		$("#help0").remove();
		
		//prepare for arbitrary placement of items(into the playlist(s))
		insert_item = mq.pl_item_active; //position to insert or overwrite at
		delete_items = 0; //overwrite or simply remove items
		
		mq.pl.splice(	insert_item, 
						delete_items,
						new mqItem(event.dataTransfer.getData('Text'))
					);
		
		mq.setupState();
		
		mq.savePls();
	});

});



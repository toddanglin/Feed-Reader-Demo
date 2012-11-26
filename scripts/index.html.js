//Application Logic
window.app = (function($, fm, tl, kendo, console){
	"use strict";
	var _grid = $("#feedGrid"),
		_feedItems = $("#feedItems"),
		_feedList = $("#feedList"),
		_postDetail = $("#postDetail"),
		_addWindow = $("#addFeedWindow"),
		_rowTemplate,
		_postDetailTemplate,
		_panelItemTemplate,

	    _clickHandlers = {
			"addFeed": function(){
				var win = _addWindow.data("kendoWindow");

				win.center();
				win.open();
			},
			"removeFeed": function() {
			    //Get URL of currently selected feed in panelbar
				var that = this,
					panel = _feedList.data("kendoPanelBar"),
					selectedItem = panel.select(),
					url = $(selectedItem).data("feedUrl");
				
				$(document).bind("FEED_MANAGER_FEED_REMOVED", function(e,data){
					if(data > -1){
						_api.refreshFeedList();

						//Select next available feed (if any are available)
						var ele = $("#feedItems > li:last-of-type");
						if(ele !== undefined){
							panel.select(ele);
							$(ele).trigger("click");
						}
					}else{
						alert("Sorry. That feed couldn't be removed.");
					}
				});

				fm.removeFeed(url);
			},
			"toggleSummary": function() {
				$(".post-summary").fadeToggle();
			},
			"goToPost": function() {
				var url = $(".post").data("postUrl");

				window.open(url);
			},
			"saveFeed": function() {
				var txtUrl = $("#txtFeedUrl");
				fm.addFeed(txtUrl.val());
			
				$(document).bind("FEED_MANAGER_FEED_ADDED", function(e){
					//On success close window
					_api.refreshFeedList();
					
					//Clear textbox
					txtUrl.val("");
					
					var win = _addWindow.data("kendoWindow");
					win.close();
				});
			},
			"onFeedItemClick": function(e) {
				var url = $(this).data("feedUrl");
				if(url === undefined) return;
				
				console.log('Selected Feed URL: '+ url);
				
				fm.configureFeedItemDS(url);
				
				//Refresh feed post grid
				_api.refreshPostGrid();
			},
			"onPostGridRowChange": function(e) {
				//Display selected post in viewer area
				var url = $(this.select()[0]).data("postUrl"),
				 	d = fm.getFeedItemDS().data(),//Get item from data source
					item = null,
					i = 0;
				
				console.log("POST URL: "+ url);
					
				for (i = 0; i < d.length-1; i++) {
					if(d[i].link === url){
						item = d[i];
						break;
					}
				}
				
				if(item === null){
					console.log("Item could not be matched");
					return;
				}
				
				console.log(item);
					
				_postDetail.html(_postDetailTemplate(item));
			}
		},
	
	    _private = {
			//Initializes Kendo UI Elements
			
			initKendoUI: function(){
				console.log('Initializing Kendo UI widgets');
				
				//Init splitter view
				$("#mainVsplit").kendoSplitter({
					panes:[
						{
							collapsible:true,
							scrollable:false,
							max:"300px",
							min:"50px",
							size:"20%"
						},
						{
							collapsible:false,
							scrollable:false,
							size:"80%"
						}
					],
					orientation: "horizontal"
				});
				
				$("#mainHsplit").kendoSplitter({
					panes:[
						{
							min:"100px",
							scrollable:false
						},
						{
							min:"100px",
							scrollable:false
						}
					],
					orientation: "vertical"
				});
				
				//Init Window
				_addWindow.kendoWindow({
					title:"Add Feed",
					visible:false,
					actions:["Close"],
					resizable:false,
					modal:true
				}).css("display","block");
			},
			
			createKendoPostGrid: function(){
				_grid.kendoGrid({
					dataSource: fm.getFeedItemDS(),
					sortable:true,
					scrollable:true,
					selectable:"row",
					navigatable:true,
					height:"100%",
					rowTemplate:_rowTemplate,
					columns:[
						{
							field:"title",
							title:"Post Title"
						},
						{
							field:"pubDate",
							title:"Date Published"
						}	
					],
					change:_clickHandlers.onPostGridRowChange
				});
			},
			
			initDelegates: function(){
				//Buttons
				$(document).delegate("button", "click", function(e){
					var that = $(this),
						eventData = that.data("event");
					
					_clickHandlers[eventData](e);
				});		
				
				//PanelBar
				_feedItems.delegate("li", "click", _clickHandlers.onFeedItemClick);		
			}
					
		},
	
	_api = {
		//Binds Kendo Grid to feed items
		refreshPostGrid: function(){
			var grid = _grid.data("kendoGrid"),
				ds;

			if(grid === undefined){				
				_private.createKendoPostGrid();
			}else{
				ds = fm.getFeedItemDS();
				ds.read();
			}
		},
		
		refreshFeedList: function(){
			var feeds = fm.getFeeds();
			
			if(feeds !== null && feeds.length > 0){
				//Render items in PanelBar
				_feedItems.html(_panelItemTemplate(feeds));				
			}else{
				_feedItems.html("<li>No feeds loaded</li>");
			}
			
			_feedList.kendoPanelBar();
		},
		
		//Page Init
		init: function(){
			var that = this;
			
			//Load external template definitions and inject in to DOM
			tl.loadExtTemplate("templates/_index.tmpl.htm");
			
			//Subscribe to event triggered when templates loaded
			//(Don't load Kendo UI before templates are available)
			$(document).bind("FEED_MANAGER_TEMPLATE_LOADED", function(e, data) {
				console.log('Templates loaded');			
				
				//Compile and cache templates
				_rowTemplate = kendo.template($("#rowPost-Summary").html(),{useWithBlock:false});
				_postDetailTemplate = kendo.template($("#tmplPostDetail").html(),{useWithBlock:false});
				_panelItemTemplate = kendo.template($("#feedItem").html(), {useWithBlock:false});
				
				//Load Feed Items
				that.refreshFeedList();
					
				_private.initKendoUI();
				
				_private.initDelegates();
				
				//Trigger event indicating init is complete
				$(document).trigger("FEED_READER_APP_READY");
			});		
		}		
	};
	
	return _api;
	
}(jQuery, feedManager, templateLoader, kendo, console));

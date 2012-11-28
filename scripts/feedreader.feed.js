//FeedReader.Feed
var feedManager = (function($, host, kendo, console){
	var _feedItemDS;
	
	var _private = {
		feeds: $.parseJSON(localStorage.feeds),
		
		getFeedItemDS: function(){
			if(_feedItemDS === undefined){
			
				//**HACK for OPERA (and non-XHR2/XDR browsers)
				//For lack of a reasonable Opera workaround to support CORS, fallback to use
				//YQL support for JSONP when dealing with a browser than doesn't support 
				//CORS XHR or XDR
				if (!('withCredentials' in new XMLHttpRequest()) && !(typeof XDomainRequest !== "undefined")){
					_feedItemDS = new kendo.data.DataSource({
						transport:{
							read:{
								url: "#",
								dataType: "jsonp"
							},
			                dialect: function (options) {
			                    var result = ["callback=?","format=json"],
			                        data = options || {};
			 
			                    return result.join("&");
			                }
						},
						schema:{
							type:"json",
							data:"query.results.rss.channel.item",
						}
					});
				//**END OPERA/Non-CORS HACK
				}else{
					_feedItemDS = new kendo.data.DataSource({
						transport:{
							read:{
								url: "#",
								dataType: "xml"
							}
						},
						schema:{
							type:"xml",
							data:"query/results/rss/channel/item",
							model:{
								id:"guid",
								fields:{
									title: "title/text()",
									pubDate: "pubDate/text()",
									description: "description/text()",
									link: "link/text()",
									id: "guid/text()"			
								}
							}
						}
					});
				}
			}
			
			return _feedItemDS;
		},
		
		getDetails: function(url, callback){
			var title;
			
			this.getTitle(url, function(title){
				var newFeed = { Name: title, URL: url };
				
				callback(newFeed);
			});
		},
		
		getTitle: function(url, callback){
			var proxyUrl = "http://query.yahooapis.com/v1/public/yql?q=select%20channel.title%20from%20xml%20where%20url%3D%22"+ encodeURIComponent(url) +"%22&format=json&callback=?";
			
			var tmpDs = new kendo.data.DataSource({
				transport:{
					read:{
						url: proxyUrl,
						dataType: "jsonp"
					}
				},
				schema:{
					data: "query"
				},
				change: function(){
					//Return the RSS feed title from the results
					callback(this._data.results.rss.channel.title);
				}
			});
			
			//Execute the DataSource read operation to query YQL
			tmpDs.read();
		}
	};
	return{
		getFeeds: function(){
				return _private.feeds;
		},
		
		configureFeedItemDS: function(url){
			//To fetch XML locally, create YQL proxy
			var proxyUrl = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'" + encodeURIComponent(url) +"'";						
			
			//Load Items
			var feedDS = _private.getFeedItemDS();
			feedDS.transport.options.read.url = proxyUrl;
		},
		
		getFeedItemDS: function(){
			return _private.getFeedItemDS();
		},
		
		addFeed: function(url){
			_private.getDetails(url, function(newFeed){
				_private.feeds.push(newFeed);
				
				//Persist new feed to localStorage array
				localStorage.feeds = kendo.stringify(_private.feeds);				
				console.log("New Feed Saved: "+ newFeed.Name);
				
				//Publish event notifying of new feed items
				$(host).trigger("FEED_MANAGER_FEED_ADDED");
			});
		},
		
		removeFeed: function(url){
			var feeds = _private.feeds;
			
			var idx = -1; 
			for (var i = 0; i < feeds.length; i++) {		
				if(feeds[i].URL === url){
					idx = i;
					break;
				}
			}
			
			console.log("Feed Found at "+ idx, feeds[i]);
			console.log("Start: "+ _private.feeds.length);
			if(idx > -1){
				_private.feeds.splice(idx,1);
				localStorage.feeds = kendo.stringify(_private.feeds);
			}	
			console.log("End: "+ _private.feeds.length);				
								
			//Publish event notifying of feed item removed
			$(host).trigger("FEED_MANAGER_FEED_REMOVED", [idx]);
		},
		
		init: function(){
			if(localStorage.feeds === undefined || localStorage.feeds === null || localStorage.feeds === "[]"){
				//Add a default item to local storage
				//var defaultFeed = { Name: "Engadget", URL: "http://www.engadget.com/rss.xml" };
				var defaultFeed = { Name: "Kendo UI", URL: "http://www.kendoui.com/blogs/blogs.rss" };

				localStorage.feeds = kendo.stringify([defaultFeed]);
				
				_private.feeds = [defaultFeed];
			}
			
			console.log("Feed Manager init done");
		}
	}
})(jQuery, document, kendo, console);
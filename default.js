const defaultSettings = {
	"searchEngineData": [{
		"name": "Google",
		"urlTemplate": "https://www.google.com/search?q={searchTerms}",
		"headerLinks": {
			"mail": {
				"url": "https://mail.google.com/mail/u/0/",
				"title": "Gmail",
				"icon": ""
			},
			"imageSearch": {
				"url": "https://www.google.com/imghp",
				"title": "Image Search",
				"icon": ""
			}
		}
	}, {
		"name": "Bing",
		"urlTemplate": "https://www.bing.com/search?q={searchTerms}",
		"headerLinks": {
			"mail": {
				"url": "https://outlook.live.com/",
				"title": "Outlook",
				"icon": ""
			},
			"imageSearch": {
				"url": "https://www.bing.com/images/search",
				"title": "Bing Images",
				"icon": ""
			}
		}
	}, {
		"name": "Yahoo",
		"urlTemplate": "https://search.yahoo.com/search?p={searchTerms}",
		"headerLinks": {
			"mail": {
				"url": "https://mail.yahoo.com/",
				"title": "Yahoo! Mail",
				"icon": ""
			},
			"imageSearch": {
				"url": "https://images.search.yahoo.com/",
				"title": "Yahoo! Images",
				"icon": ""
			}
		}
	}, {
		"name": "DuckDuckGo",
		"urlTemplate": "https://duckduckgo.com/?q={searchTerms}",
		"headerLinks": {
			"mail": {
				"url": "",
				"title": "",
				"icon": ""
			},
			"imageSearch": {
				"url": "https://duckduckgo.com/?q=images&iax=images&ia=images",
				"title": "DuckDuckGo Images",
				"icon": ""
			}
		}
	}],
	"linksPerRow": 5,
	"numberOfRows": 2
};

/*
Jbmflickr v1.2
by Jan Bashaijha Mwesigwa - http://www.seven-m.com

For more information, visit:
http://www.seven-m.com/jbmflickr

Licensed under the GPL v2 License
- free for use in both personal and commercial projects
- attribution requires leaving author name, author link, and the license info intact
*/
(function ($, window, document) {
	
	$(function () {
        var log = {
            debug : true,
            error : function(message) {
                var m = 'JBMFlickr error';
                try {
                  if (this.debug && window.console && window.console.error){
                    window.console.error([m, message].join(': '));
                  }
                } catch (e) {
                  // no console available
                }
            },
            info : function(message) {
                var m = 'JBMFlickr notice';
                try {    
                    if (window.console && window.console.info){
                        window.console.info([m, message].join(': '));
                    }
                } catch (e) {
                  // no console available
                }
            }
        }
        
        var flickr = {
            xhrPool : [],
            init : function( options ) { 
                return this.each(function() {
                    
                    // get options from attributes
                    var attrs = {};
                    $.each(this.attributes, function(i,v){
                        if (/jbmflickr/.test(v.nodeName)) {
                            attrs[v.nodeName.replace('jbmflickr-','')] = v.nodeValue;
                        }
                    });
                    options = $.isPlainObject(options) ? options : {};
                    $.extend(options, attrs);
                    
                    var $this = $(this),
                        params = {
                            userid: "",
                            link_images: true,
                            lightbox: true,
                            lightbox_theme: 'default',
                            template: "",
                            thumbnail_size: 'q',
                            per_page: 10
                        };

                    // plugin not yet initialized?
                    if (typeof $this.data('jbmflickr') == 'undefined') {   
                        $this.data('jbmflickr', $.extend(params, options));
                        flickr.$this = $this;
                        var o = flickr.getSettings();
                    } else {
                        log.info('jbmflickr already initialized');
                        return;
                    }
                    
                    // get base path
                    var basePath = flickr.set('basePath', $('script').filter(function(){ return /(jbmflickr\.js|jbmflickr\.dev\.js)/.test($(this).attr('src')) }).attr('src')
                        .replace('jbmflickr.js','')
                        .replace('jbmflickr.dev.js',''))
                    
                    // load main css
                    $('<link />')
                        .appendTo($('head'))
                        .attr({type: 'text/css', rel: 'stylesheet'})
                        .attr('href', basePath + 'jbmflickr.css');
                        
                    // load lightbox 
                    if (flickr.get('lightbox',true,'boolean')) {
                        $.getScript(basePath + 'libs/lightbox/lightbox.js')
                            .done(function(){ 
                                log.info('lightbox script loaded');
                                $('<link />')
                                    .appendTo($('head'))
                                    .attr({type: 'text/css', rel: 'stylesheet'})
                                    .attr('href', basePath + 'libs/lightbox/css/' + flickr.get('lightbox_theme','default') + '/lightbox.css');
                            })
                            .fail(function(){ log.error('failed to load lightbox script') })
                    }
                    
                    // load jcycle2..save as deferred
                    flickr.jcycleLoaded = $.getScript(basePath + 'libs/jcycle/jcycle.js')
                        .done(function(){ log.info('jcycle2 script loaded') })
                        .fail(function(){ log.error('failed to load jcycle2 script') })
                    
                    // insert container for slides
                    flickr.$slides = $('<div class="slides" />').appendTo($this);
                    
                    // init pagination
                    flickr.Display.init();
                    
                    // prepare search input field
                    if ($('.jbmflickr-search-field').length) {
                        $('.jbmflickr-search-field').change(function(){
                            flickr.load({ 
                                text: $(this).val()
                            })
                        })
                    }

                    // load photos
                    if (flickr.get('initial_load',false,'boolean')) {
                        flickr.load();
                    }
                });
            },
            Display : {
                init : function(numPages) {
                    this.pager = flickr.get('pager','<div class="pager" />');
                    var $this = flickr.$this,
                        $pager = $(this.pager).appendTo($this),
                        $this = flickr.$this,
                        Display = this;
                    
                    this.params = {
                        fx: 'scrollHorz',
                        speed: parseInt(flickr.get('slideshow_speed',2000)),
                        timeout: parseInt(flickr.get('slideshow_timeout',3000)),
                        log : false,
                        slides: '.page',
                        pager: '.pager',
                        events: {
                            'cycle-slide-added' : function(event, s, a, slide) {
                                // turn on lightbox
                                $(slide).find('a.lightbox-link').attr('rel','lightbox[gallery]');
                                // custom code
                                if (typeof flickr.get('',null) == 'function') {
                                    flickr.get('').call($(slide)); 
                                } else { 
                                    $(slide).find('.flickr-item').hover(
                                        function(){
                                            $(this).find('.description').show(200);
                                        },
                                        function(){
                                            $(this).find('.description').hide(200);
                                        }
                                    );
                                }
                            }
                        }
                    }
                    
                    // wait for jcycle2 is loaded
                    $.when(flickr.jcycleLoaded)
                        .done(function() {
                            flickr.$slides
                                .bind(Display.params.events)
                                .cycle(Display.params)
                        })
                        .fail(function() { log.error('JCycle2 was not loaded.') })
                },
                clear: function() {
                    flickr.$slides.empty();
                },
                show : function(imgs) {
                    var $this = flickr.$this,
                        $slides = flickr.$slides,
                        nextSlides = [],
                        dImgs = [],
                        Display = this,
                        sizes = {
                            s : 75,
                            q : 150,
                            t : 100,
                            m : 240,
                            n : 320,
                            '-' : 500,
                            z : 640
                        },
                        pages = [],
                        template = flickr.get('template','<div class="flickr-item"><a class="lightbox-link" href="{url_z}" title="{title}"><div class="photo-wrapper"><div class="photo" style="background-image: url({url_'+flickr.get('thumbnail_size','q')+'});width: {width_q}px;height: {height_q}px"></div></div></a><div class="description"><div class="inner">{title}</div></div></div>'),
                        items = [];
                    Display.clear();
                    if (!imgs.length) {
                        $slides.append($('<div class="placeholder" />').css({
                            width: sizes[flickr.get('thumbnail_size','q')]+'px',
                            height: sizes[flickr.get('thumbnail_size','q')]+'px'
                        }));
                        $slides.cycle('destroy').off();
                        return;
                    }
                    $.each(imgs, function(i,img){
                        var item = template;
                        $.each(img,function(j,v) {
                            var r = new RegExp('{'+j+'}','g');
                            item = item.replace(r,img[j]);
                        });
                        items.push(item);
                    })
                    function wrapPage(p) {
                        p = '<div class="page">'+p+'</div>';
                        return p;
                    }
                    // form pages
                    while(items.length > flickr.get('per_page')){
                        pages.push(wrapPage(items.splice(0,flickr.get('per_page')).join('')));
                    } 
                    pages.push(wrapPage(items.join('')));
                    
                    Display.params['progressive'] = pages.splice(1);
                    // reinit slideshow
                    $slides.find('.cycle-slide').remove();
                    $.when(flickr.jcycleLoaded).done(function() { 
                        $slides
                            .cycle('destroy')
                            .off()
                            .on(Display.params.events)
                            .cycle(Display.params)
                            .cycle('add',pages[0])
                    })
                }
            },
            getPhotosUrl : function(params) {
                var settings = {
                        page: 1,
                        per_page: 500,
                        media: 'all',
                        method: 'flickr.photos.search'
                    },
                    required = {
                        api_key: "311d9b69c2112e4263bfec74f3febf0d",
                        format: 'json',
                        user_id: encodeURIComponent(flickr.get('userid')),
                        nojsoncallback: '1',
                        content_type: '7',
                        extras: 'tags,description,url_sq,url_t,url_s,url_q,url_m,url_n,url_z,url_c, url_l,url_o'
                    },
                    url = "https://api.flickr.com/services/rest/?";
                
                // remove tags and text params..they cause flickr API error
                $.extend(settings, params, required);
                if (settings.tags) delete settings.tags;
                if (settings.text) delete settings.text;
                return url + decodeURIComponent($.param(settings));
            },
            _filterData : function(data, params) {
                if (!params.tags && !params.text) return data;
                var r = [], flag = false,
                    isInString = function(needle, haystack) {
                        needle
                            .replace(/[\W]/g,"|")
                            .replace(/\|{2,}/,"|")
                            .replace(/(^\||\|$)/g,"");
                        return new RegExp('(' + needle + ')','i').test(haystack);
                    } 
                $.each(data.photos.photo, function(index,v) {
                    // filter tags 
                    if (params.tags) {
                        flag = isInString(params.tags, v.tags);
                    } 
                    // filter text in description and title
                    if (params.text) {
                        flag = isInString(params.text, v.title+' '+v.description);
                    } 
                    if (flag) r.push(v);
                })
                data.photos.photo = r;
                data.photos.total = r.length;
                return data;
            },
            load: function(params){
                var _this = flickr,
                    $this = flickr.$this;
                
                if (arguments.length == 0) {
                    params = {};
                }

                url = flickr.getPhotosUrl(params);
            
                flickr.xhrPool.push($.ajax({
                        url: url,
                        type: 'GET',
                        cache: true,
                        dataType: 'json'
                    })
                    .fail(function(xhr, errMsg, err) { log.error(errMsg); })
                    .done(function(data) {
                        if (data.stat !== 'ok') { 
                            log.error('Error retrieving data: ' + data.message);
                            return; 
                        }
                        // filter photos and show
                        data = flickr._filterData(data, params);
                        flickr.Display.show(data.photos.photo);
                    })
                )
            },
            get : function(param, def, type) {
                var $this = flickr.$this,
                    o = flickr.getSettings();
                type = type ? type : '';
                switch (type) {
                    case 'int' : 
                        return o[param] ? parseInt(o[param]) : (def ? def : false);
                        break;
                    case 'float' : 
                        return o[param] ? parseFloat(o[param]) : (def ? def : false);
                        break;
                    case 'boolean' :
                        if (typeof o[param] === 'boolean') {
                            return o[param];
                        } else if (typeof o[param] === 'string') {
                            p = o[param].toLowerCase(); 
                            return (p == 'true' || p == '1') ? true : false;
                        } else if (typeof o[param] === 'number') {
                            return o[param] == 0 ? false : true;
                        } else {
                            return (def ? def : false);
                        }
                        break;
                    default : return o[param] ? o[param] : (def ? def : '');
                }
            },
            set : function(param, value) {
                var $this = flickr.$this,
                    o = flickr.getSettings();

                if (!o) return false;
                o[param] = value;
                return value;
            },
            getSettings : function() {
                var $this = flickr.$this;
                return $this.data('jbmflickr');
            },
            
            /*
            * public methods
            * this refers to div container
            */
            search : function(params, xhr) {
                return this.each(function() {
                    flickr.load(params);
                });
            },
            destroy : function() {
                return this.each(function() {
                    var $this = $(this);
                    $this.unbind().empty();
                })
            }
        }
        
        $.fn.jbmflickr = function( method ) {
            var public = 'destroy, search',
                isPublic = false;
            
            if (typeof method === 'string') {
                var r = new RegExp(method, 'i');
                isPublic = r.test(public);
            }

            // Method calling logic
            if (typeof method ==='string' && !isPublic) {
                log.error( method + ' is a protected method on jQuery.JBMflickr' );
            } else if ( flickr[method] ) {
                return flickr[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return flickr.init.apply( this, arguments );
            } else {
                log.error( 'Method ' +  method + ' does not exist on jQuery.JBMflickr' );
            } 
        }; 


        /* FLICKR MAP CODE */
        var flickrmap = {
            init: function(options) {
                return this.each(function() {
                    // get options from attributes
                    var attrs = {}
                    $.each(this.attributes, function(i,v){
                        if (/^jbmflickrmap/.test(v.nodeName)) {
                            attrs[v.nodeName.replace('jbmflickrmap-','')] = v.nodeValue;
                        }
                    });
                    options = $.isPlainObject(options) ? options : {},
                    $.extend(options, attrs);
                    
                    var $this = $(this),
                        params = $.extend({
                            userid: null,
                            zoom: 5,
                            limit: 200,
                            marker: 'google'
                        }, options);
                    
                    // plugin not yet initialized?
                    if (typeof $this.data('jbmflickrmap') == 'undefined') {   
                        $this.data('jbmflickrmap', $.extend(params, options));
                        flickrmap.$this = $this;
                        var o = flickrmap.getSettings();
                    } else {
                        log.info('jbmflickrmap already initialized');
                        return;
                    }

                    // get base path
                    var basePath = $('script').filter(function(){ return /(jbmflickr|jbmflickr\.dev)\.js/.test($(this).attr('src')) }).attr('src')
                        .replace('jbmflickr.js','')
                        .replace('jbmflickr.dev.js','')
                    
                    // treat some values
                    if (!params.userid) return;
                    if (params.zoom) params.zoom = parseInt(params.zoom);

                    function initialize() {
                        var myLatlng = new google.maps.LatLng(44.699898, 34.189453);
                        var mapOptions = {
                            center: myLatlng,
                            zoom: params.zoom,
                            scrollwheel: false,
                            keyboardShortcuts: false
                        }
                        var map = new google.maps.Map($this.get(0), mapOptions);
                        var url = flickrmap.getFeedUrl(params);
                        function showStandardKmlLayer() {
                            var georssLayer = new google.maps.KmlLayer({
                                url:url,
                                preserveViewport: true,
                                map: map
                            });
                        }
                        var getFeed = $.ajax({
                                url: url,
                                type: 'GET',
                                cache: true,
                                dataType: 'text'
                            });
                        $.getScript('http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerclusterer/1.0.2/src/markerclusterer.js')
                            .done(function() {
                                $.getScript(basePath + 'libs/geoxml3/geoxml3.js')
                                    .done(function() {
                                        markerclusterer  = new MarkerClusterer(map, []);
                                        //Construct a geoXML3 parser
                                        var points=[];
                                        var parser = new geoXML3.parser({
                                                map: map,
                                                zoom: false,
                                                processStyles:true,
                                                failedParse : function() { showStandardKmlLayer() },
                                                createMarker:function(placemark, parser){
                                                    var point = {
                                                        lat: placemark.Point.coordinates[0].lat,
                                                        lng: placemark.Point.coordinates[0].lng
                                                    }
                                                    function fixLocation(point) {
                                                        if ($.inArray([point.lat,point.lng].join(':'), points) >= 0) {
                                                            point.lng += 0.02;
                                                            fixLocation(point);
                                                        } else return;
                                                    }
                                                    fixLocation(point);
                                                    var mapPoint = new google.maps.LatLng(point.lat, point.lng);
                                                    points.push([point.lat,point.lng].join(':'));
                                                    
                                                    var href = placemark.styleUrl.replace('#styleMap/photo','//www.flickr.com/photos/'+flickrmap.get('userid'));

                                                    var content = $('<div />')
                                                            .append($('<div class="title" />').text(placemark.name))
                                                            .append($('<img />').attr({src: placemark.style.href.replace('_s.jpg','_m.jpg'), alt: placemark.name }))
                                                            .append('<br />')
                                                            .append($('<a />').text('view large').attr({
                                                                    href: href,
                                                                    target: '_blank'
                                                                }))
                                                            .html()
                                                    
                                                    
                                                    var infowindow = new google.maps.InfoWindow({
                                                        content: content,
                                                        maxWidth: 400
                                                    });
                                                    var icon = null;
                                                    switch (flickrmap.get('marker')) {
                                                        case 'photo' : icon = placemark.style.icon; break;
                                                        case 'google' : icon = null; break;
                                                        default: icon = flickrmap.get('marker',null);
                                                    }
                                                    var marker = new google.maps.Marker({
                                                        position:point,
                                                        icon: icon,
                                                        flat: false,
                                                        title: placemark.name
                                                    });
                                                    
                                                    google.maps.event.addListener(marker, 'click', function() {
                                                        infowindow.open(map, marker);
                                                    });
                                                    
                                                    markerclusterer.addMarker(marker);
                                                }
                                            });
                                        getFeed
                                            .done(function(feed) {
                                                parser.parseKmlString(feed);  
                                            })
                                            .fail(function() { showStandardKmlLayer() })
                                    })
                            })
                            .fail(function() { showStandardKmlLayer() })
                        
                        // save map api into container data
                        o.map = map;
                    }
                    // load googlemaps API
                    // load the google api loader
                    if( typeof(google) == 'undefined' || !google.load ) {
                        $.getScript( '//www.google.com/jsapi', function() {
                            loadMaps();
                        });
                    } else {
                        loadMaps();
                    }
                    // load the google maps api
                    function loadMaps() {
                        google.load("maps", "3", {
                            callback: initialize,
                            other_params: 'sensor=false'
                        });
                    }

                })
            },
            getFeedUrl : function(params) {
                var settings = {
                        page: 1,
                        per_page: flickrmap.get('limit', 40),
                        tags: '',
                        text: '',
                        format: 'feed-kml',
                        media: 'photos',
                        method: 'flickr.photos.search',
                        has_geo:'1'
                    },
                    required = {
                        api_key: "311d9b69c2112e4263bfec74f3febf0d",
                        user_id: flickrmap.get('userid'),
                        jsoncallback: '?',
                        content_type: '7'
                    },
                    url = "https://api.flickr.com/services/rest/?";
                
                $.extend(settings, params, required);
                return url + decodeURIComponent($.param(settings));
            },
            /* Public method */
            locate : function(address) {
                return this.each(function() {
                    var $this = $(this),
                        map = flickrmap.getSettings().map,
                        geocoder = new google.maps.Geocoder();
                    if (geocoder) {
                        geocoder.geocode({ 'address': address }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                map.fitBounds(results[0].geometry.viewport);
                                // show images from this area
                                var b = map.getBounds();
                                var lat0 = b.getSouthWest().lat();
                                var lon0 = b.getSouthWest().lng();
                                var lat1 = b.getNorthEast().lat();
                                var lon1 = b.getNorthEast().lng();
                                var bbox = [lon0,lat0,lon1,lat1].join(',');
                                $('.jbmflickr').jbmflickr('search', {bbox: bbox, accuracy:1});
                            }
                        });
                    }
                });
            },
            get : function(param, def, type) {
                var $this = flickrmap.$this,
                    o = flickrmap.getSettings();
                type = type ? type : '';
                switch (type) {
                    case 'int' : 
                        return o[param] ? parseInt(o[param]) : (def ? def : false);
                        break;
                    case 'float' : 
                        return o[param] ? parseFloat(o[param]) : (def ? def : false);
                        break;
                    case 'boolean' :
                        if (typeof o[param] === 'boolean') {
                            return o[param];
                        } else if (typeof o[param] === 'string') {
                            p = o[param].toLowerCase(); 
                            return (p == 'true' || p == '1') ? true : false;
                        } else if (typeof o[param] === 'number') {
                            return o[param] == 0 ? false : true;
                        } else {
                            return (def ? def : false);
                        }
                        break;
                    default : return o[param] ? o[param] : (def ? def : '');
                }
            },
            set : function(param, value) {
                var $this = flickrmap.$this,
                    o = flickrmap.getSettings();

                if (!o) return false;
                o[param] = value;
                return value;
            },
            getSettings : function() {
                var $this = flickrmap.$this;
                return $this.data('jbmflickrmap');
            },
        }
        $.fn.jbmflickrmap = function( method ) {
            var public = 'destroy, locate',
                isPublic = false;
            
            if (typeof method === 'string') {
                var r = new RegExp(method, 'i');
                isPublic = r.test(public);
            }

            // Method calling logic
            if (typeof method ==='string' && !isPublic) {
                log.error( method + ' is a protected method on jQuery.JBMflickrmap' );
            } else if ( flickrmap[method] ) {
                return flickrmap[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return flickrmap.init.apply( this, arguments );
            } else {
                log.error( 'Method ' +  method + ' does not exist on jQuery.JBMflickrmap' );
            } 
        };
        
        
        /*
        * Initialization based on attributes
        */
        // JBMFlickrmap
        if ($('.jbmflickrmap').length) {
            $('.jbmflickrmap').jbmflickrmap();
        }
        // JBMFlickrmap location
        if ($('.jbmflickrmap-location')) {
            // bind event
            $('.jbmflickrmap-location').change(function() {
                // check which map
                if ($('#'+$('.jbmflickrmap-location').attr('rel')).length) { 
                    $('#'+$('.jbmflickrmap-location').attr('rel')).jbmflickrmap('locate', $(this).val());
                } else {
                    $('.jbmflickrmap').jbmflickrmap('locate', $(this).val())
                }
            })
        }
        // JBMFlickr
        if ($('.jbmflickr').length) {
            $('.jbmflickr').jbmflickr();
        }
        // JBMFlickr tag cloud
        if ($('.jbmflickr-tag-cloud').length) {
            // check for jbmflickr 
            if ($('.jbmflickr').length) {
                $('.jbmflickr-tag-cloud > a').click(function(e){
                    e.preventDefault();
                    $('.jbmflickr').jbmflickr('search',{tags:$(this).attr('href').replace('#','')});
                });
            }   
        }
        
    
    })
} (this.jQuery, this, this.document));
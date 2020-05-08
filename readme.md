# JBMFLICKR - JQUERY PLUGIN

## AUTHOR
Name: Jan B Mwesigwa

URL: https://madmonkey.works



## DEMO

http://www.seven-m.com/demos/jbmflickr/

http://www.amicafoundation.com/en/collection.html



## DESCRIPTION

Jbmflickr is a jQuery plugin that pulls images hosted on flickr and shows them in a lightbox-style gallery or in a google map. 
It allows you to: 
- search images by a text or tag entered in an input field
- define your tag-cloud to retrieve tagged images
- retrieve geo tagged images and display them in a googlemap
- dynamically search googlemap and retrieve geo tagged images from a specific location 


## INSTALLATION
1) Download the zip file, unzip it and insert the content into a folder (e.g. 'jbmflickr') anywhere on your website.

2) Link the script 'jbmflickr.js' in the head section of your html file.

3) Create div elements with class "jbmflickr" or "jbmflickrmap" 

 

## INITIALIZATION
In your html, insert a div element with class 'jbmflickr' and attributes.

Attributes serve as plugin options, e.g. jbmflickr-userid="xxxxxx".

See examples and all available options below...

 
### DISPLAY IMAGES
```html
<div class="jbmflickr"
    jbmflickr-userid="xxxxxxxx"
    jbmflickr-initial_load="1"
    jbmflickr-thumbnail_size="q"
    jbmflickr-per_page="8"
    jbmflickr-per_row="8"
></div>
```
 
### SEARCH BY KEYWORDS OR TAGS
```html
<input type="text" class="jbmflickr-search-field" size="50" placeholder="Enter search text and hit enter"/>
```

 

### USE TAG-CLOUD
```html
<div class="jbmflickr-tag-cloud">
    <span>tags: </span>
    <a href="#animal">animal</a>
    <a href="#nature">nature</a>
    <a href="#celebration">celebration</a>
    <a href="#playing">playing</a>
</div>
```

### DISPLAY GEO TAGGED IMAGES IN GOOGLE MAP 
```html
<div class="jbmflickrmap" style="height:400px; width: 100%;"
    jbmflickrmap-userid="xxxxxx"
    jbmflickrmap-zoom="2"
></div>
```
 

### SEARCH BY GOOGLE LOCATION
```html
<input type="text" class="jbmflickrmap-location" placeholder="Enter a location (country, city), e.g. 'Netherlands'" rel="myMap" />
```

The map zooms to the location entered in the field. If 'rel' attribute is defined, only the map with such 'id' will get zoomed.

 

## PLUGIN OPTIONS
The following table shows all attributes that you can use to specify plugin options.


### ATTRIBUTES

Attribute: jbmflickr-userid	

Data type: string	

Default value: required	

Description: This is the flickr user ID. Attention: this is not the username but an ID. If you don't know what your ID is, check it via www.idgettr.com.



Attribute: jbmflickr-initial_load	

Data type: boolean 	

Default value: "1" 	

Descriptio: If "1" then plugin loads images upon the page loads. if "0" then plugin will not load anything.



Attribute: jbmflickr-thumbnail_size	

Data type: string	

Default value: "m"	

Description: Defines size of the images. Possible values are based on flickr specifications:

* s small square 75x75
* q large square 150x150
* t thumbnail, 100 on longest side
* m small, 240 on longest side
* n small, 320 on longest side
* medium, 500 on longest side
* z medium 640, 640 on longest side
* ...see http://www.flickr.com/services/api/misc.urls.html



#### Attribute: jbmflickr-per_page	

Data type: integer	

Default value: "8"	

Description: Defines number of images per page.




#### Attribute: jbmflickr-per_row	

Data type: integer	

Default value: "8"	

Description: Defines number of images per row. 




#### Attribute: jbmflickr-link_images	

Data type: boolean	

Default Value: "1"	

Description: If "1" then image thumbnails will act as links to large images.




#### Attribute: jbmflickr-lightbox	

Data type: boolean	

Default value: "1"	

Description: If "1" then lightbox will be used to enlarge image when a thumbnail is clicked.




#### Attribute: jbmflickr-lightbox_theme	

Data type: string	

Default Value: "default"	

Description: Name of the custom theme. You can create your own 'default.css' file and insert it into the folder "libs/lightbox/css/your_theme"




##### For Google map container ...div with class 'jbmflickrmap'

#### Attribute: jbmflickrmap-userid	

Data type: string	

Default Value: required	

Description: This is the flickr user ID. Attention: this is not the username but an ID. If you don't know what your ID is, check it via www.idgettr.com.





#### Attribute: jbmflickrmap-zoom	

Data type: integer	

Default Value: "5"	

Description: Initial zoom. Values between 0 - 15.





#### Attribute: jbmflickrmap-limit

Data type: integer	

Default Value: "200"	

Description: Max. number of retrieved images.
 



## NOT TO DO
Do NOT rename the 'jbmflickr.js' file, or change its location within its parent directory. This would break proper determination of the base path necessary for the inclusion of other scripts.


##CREDITS
The jbmflickr plugin wouldn't be possible without:

- lightbox2 made by Lokesh Dhakar... http://lokeshdhakar.com/projects/lightbox2/

- jcycle2 made by Mike Alsup... http://jquery.malsup.com/cycle2/

- geoxml3 by Sterling Udell, Larry Ross... https://code.google.com/p/geoxml3/

- Marker Clusterer by Luke Mahe... https://code.google.com/p/google-maps-utility-library-v3/source/browse/trunk/markerclusterer/

 

 

 

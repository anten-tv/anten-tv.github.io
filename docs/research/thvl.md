<https://github.com/phuongnamthvl/giaGA>

<https://thpn.vn/truyen-hinh-so-mat-dat/>

```js
 <script>var map;
      var layers = [];
      var markers;     

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: new google.maps.LatLng(15.9030623, 105.8066925),
          zoom: 5.6,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          disableDefaultUI: true
        });
      
      var vn = new google.maps.FusionTablesLayer({
            query: {
                select: 'geometry',
                from: '1fN_3m-AicPqQwgAevALGH7Kmi7C7yvNzgLRiP6ws'
            },
            styles: [{
                polygonOptions: {
                strokeColor: "#9f5a4f",
                strokeWeight: "0.5",
                fillColor: '#c0d6e4',
                fillOpacity: 0.02
                }
            }]    
        });
        vn.setMap(map);

      

        var ctaLayer = new google.maps.KmlLayer({
          url: 'https://github.com/phuongnamthvl/giaGA/raw/master/19tramk34.7.kmz',
          suppressInfoWindows: false,
          preserveViewport: true,
          map: map
        });
       var ctaLayer = new google.maps.KmlLayer({
          url: 'https://github.com/phuongnamthvl/giaGA/raw/master/16tramk30.1111.kmz',
          suppressInfoWindows: false,
          preserveViewport: true,
          map: map
        }); 
        
        
        var ctaLayer = new google.maps.KmlLayer({
          url: 'https://github.com/phuongnamthvl/giaGA/raw/master/mt1111.kmz',
          suppressInfoWindows: false,
          preserveViewport: true,
          map: map
        });
      }</script> 
```

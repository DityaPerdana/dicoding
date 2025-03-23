class MapInitiator {
  constructor(mapElement) {
    this.mapElement = mapElement;
    this.map = null;
    this.marker = null;
    this.position = { lat: null, lon: null };
  }

  init(latitude, longitude) {
    try {
      if (!this.mapElement) {
        console.error("Map element is null or undefined");
        return null;
      }

      latitude = !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : -6.2;
      longitude = !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : 106.8;

      if (this.map) {
        this.map.remove();
      }

      this.map = L.map(this.mapElement).setView([latitude, longitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        },
      );

      const topoLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        },
      );

      const baseLayers = {
        Standard: L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ),
        Satellite: satelliteLayer,
        Topography: topoLayer,
      };

      L.control.layers(baseLayers).addTo(this.map);

      this.map.on("click", (e) => {
        this.setMarker(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      return this.map;
    } catch (error) {
      console.error("Error initializing map:", error);
      return null;
    }
  }

  setMarker(latitude, longitude) {
    try {
      if (!this.map) return;

      this.position.lat = latitude;
      this.position.lon = longitude;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([latitude, longitude]).addTo(this.map);
      this.marker
        .bindPopup(
          `<b>Selected Location</b><br>Lat: ${latitude.toFixed(6)}<br>Lon: ${longitude.toFixed(6)}`,
        )
        .openPopup();
    } catch (error) {
      console.error("Error setting marker:", error);
    }
  }

  getPosition() {
    return this.position;
  }

  remove() {
    try {
      if (this.map) {
        this.map.off();
        this.map.remove();
        this.map = null;
        this.marker = null;
      }
    } catch (error) {
      console.error("Error removing map:", error);
    }
  }
}

export default MapInitiator;

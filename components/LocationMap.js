import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import Link from 'next/link';

export default function LocationMap({ locations, filteredLocations }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindows, setInfoWindows] = useState([]);
  const [clusterMarkers, setClusterMarkers] = useState([]);
  const [mapZoom, setMapZoom] = useState(12);
  const infoWindowsRef = useRef([]);
  const previousLocationsRef = useRef(null);
  const { isLoaded, error } = useGoogleMaps();

  // Helper to create slug from location name
  const createLocationSlug = (name) => {
    return name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7549, lng: -73.9950 },
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      gestureHandling: 'greedy',
      restriction: {
        latLngBounds: {
          north: 40.9176, // Northern boundary of NYC
          south: 40.4774, // Southern boundary of NYC
          east: -73.7004, // Eastern boundary of NYC
          west: -74.0479  // Western boundary — Hudson River, excludes NJ
        },
        strictBounds: true // Strictly enforce the bounds
      },
      styles: [
        // Hide transit stops
        {
          featureType: 'transit',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit.station',
          stylers: [{ visibility: 'off' }]
        },
        // Hide labels for POIs (restaurants, bars, etc.)
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Hide labels for water bodies
        {
          featureType: 'water',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Hide labels for parks
        {
          featureType: 'park',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Hide labels for buildings and landmarks
        {
          featureType: 'poi.attraction',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.business',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Explicitly show road name labels
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.stroke',
          stylers: [{ visibility: 'on' }]
        },
        // Explicitly show neighborhood labels
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'administrative.neighborhood',
          elementType: 'labels.text.fill',
          stylers: [{ visibility: 'on' }]
        }
      ],
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      clickableIcons: false // Disable clicking on POIs and other map features
    });

    setMap(googleMap);

    // Close InfoWindow when clicking anywhere on the map
    googleMap.addListener('click', () => {
      infoWindowsRef.current.forEach(iw => iw.close());
    });

    // Track zoom changes and update state - this triggers marker re-clustering
    // Use a small delay to ensure the zoom value is fully updated
    googleMap.addListener('zoom_changed', () => {
      setTimeout(() => {
        const newZoom = googleMap.getZoom();
        setMapZoom(newZoom);
      }, 0);
    });
    
    // Set initial zoom state
    setMapZoom(googleMap.getZoom());
  }, [isLoaded]);

  // Helper function to calculate distance between two points
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to create cluster marker (no rating, just count)
  const createClusterMarker = (count) => {
    const markerSize = 50;
    const markerColor = '#9CA3AF';
    const textColor = '#FFFFFF';
    
    const clusterSvg = `
      <svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2}" fill="${markerColor}" stroke="none"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="'Baloo 2', sans-serif" font-size="18" font-weight="bold" fill="${textColor}">${count}</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(clusterSvg);
  };

  // Add markers for locations with coordinates
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clear existing markers, clusters, and info windows
    const markersToClear = [...markers];
    const clustersToClear = [...clusterMarkers];
    const infoWindowsToClose = [...infoWindows];
    
    markersToClear.forEach(marker => marker.setMap(null));
    clustersToClear.forEach(cluster => cluster.setMap(null));
    infoWindowsToClose.forEach(infoWindow => infoWindow.close());

    const newMarkers = [];
    const newInfoWindows = [];
    const newClusterMarkers = [];
    const locationsWithCoords = filteredLocations.filter(loc => loc.latitude && loc.longitude);

    if (locationsWithCoords.length === 0) {
      // If no locations with coordinates, center on default location
      map.setCenter({ lat: 40.7549, lng: -73.9950 });
      map.setZoom(12);
      setClusterMarkers([]);
      return;
    }

    // Get current zoom from map directly to ensure accuracy
    const currentZoom = map.getZoom();
    const CLUSTER_THRESHOLD = currentZoom < 13 ? 0.5 : 0.2; // km - cluster more when zoomed out
    const SHOW_CLUSTERS = currentZoom < 13; // Show clusters when zoomed out

    if (SHOW_CLUSTERS) {
      // Group markers into clusters
      const clusters = [];
      const processed = new Set();

      locationsWithCoords.forEach((location, index) => {
        if (processed.has(index)) return;

        const cluster = {
          locations: [location],
          indices: [index],
          centerLat: location.latitude,
          centerLng: location.longitude
        };

        // Find nearby locations
        locationsWithCoords.forEach((otherLocation, otherIndex) => {
          if (otherIndex === index || processed.has(otherIndex)) return;
          
          const distance = getDistance(
            location.latitude,
            location.longitude,
            otherLocation.latitude,
            otherLocation.longitude
          );

          if (distance < CLUSTER_THRESHOLD) {
            cluster.locations.push(otherLocation);
            cluster.indices.push(otherIndex);
            // Update cluster center (average)
            cluster.centerLat = cluster.locations.reduce((sum, loc) => sum + loc.latitude, 0) / cluster.locations.length;
            cluster.centerLng = cluster.locations.reduce((sum, loc) => sum + loc.longitude, 0) / cluster.locations.length;
            processed.add(otherIndex);
          }
        });

        clusters.push(cluster);
        processed.add(index);
      });

      // Create cluster markers
      clusters.forEach((cluster) => {
        if (cluster.locations.length > 1) {
          const clusterMarker = new window.google.maps.Marker({
            position: { lat: cluster.centerLat, lng: cluster.centerLng },
            map: map,
            icon: {
              url: createClusterMarker(cluster.locations.length),
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 25)
            },
            zIndex: 1000
          });
          newClusterMarkers.push(clusterMarker);
        } else {
          // Single location - show individual marker
          const location = cluster.locations[0];
          const position = {
            lat: location.latitude,
            lng: location.longitude
          };

          const rating = location.overall || 0;
          const ratingDisplay = rating ? rating.toFixed(1) : '?';
          const markerSize = 40;
          const markerColor = '#EA3323';
          const textColor = '#FDF551';

          const markerSvg = `
            <svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2}" fill="${markerColor}" stroke="none"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="'Baloo 2', sans-serif" font-size="14" font-weight="bold" fill="${textColor}">${ratingDisplay}</text>
            </svg>
          `;
          
          const markerImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg);

          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            title: location.name.split(',')[0],
            icon: {
              url: markerImage,
              scaledSize: new window.google.maps.Size(markerSize, markerSize),
              anchor: new window.google.maps.Point(markerSize/2, markerSize/2)
            },

            zIndex: Math.round(rating * 10)
          });

          const locationSlug = createLocationSlug(location.name);
          const locationName = location.name.split(',')[0];
          const infoContent = `
            <div style="padding: 8px 12px 8px 12px; margin: 0; min-width: 200px; box-sizing: border-box; border-radius: 0; box-shadow: none; background-color: white;">
              <h3 style="margin: 0 0 6px 0; padding: 0; font-weight: 400; font-size: 24px; font-family: 'Rouge Script', cursive; color: #000000;">${locationName}</h3>
              <div style="display: flex; align-items: center; justify-content: space-between; margin: 0; padding: 0; gap: 12px; width: 100%;">
                <span style="color: #666; font-size: 16px; margin: 0; padding: 0; font-family: 'Baloo 2', sans-serif; font-weight: 500;">
                  ${location.totalPosts || 0} reviews
                </span>
                <a 
                  href="/location/${locationSlug}" 
                  style="color: #EA3323; text-decoration: underline; font-size: 16px; font-weight: 600; margin: 0; padding: 0; font-family: 'Baloo 2', sans-serif; white-space: nowrap;"
                  target="_blank"
                >
                  See Details
                </a>
              </div>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent
          });

          infoWindow.addListener('domready', () => {
            setTimeout(() => {
              const closeButton = document.querySelector('.gm-ui-hover-effect');
              if (closeButton) {
                closeButton.style.display = 'none';
              }
              
              const contentDiv = document.querySelector('.gm-style-iw-d');
              if (contentDiv) {
                contentDiv.style.padding = '0';
                contentDiv.style.paddingTop = '0';
                contentDiv.style.paddingRight = '0';
                contentDiv.style.paddingBottom = '0';
                contentDiv.style.paddingLeft = '0';
              }
              
              const mainContainer = document.querySelector('.gm-style-iw.gm-style-iw-c');
              if (mainContainer) {
                mainContainer.style.padding = '0';
                mainContainer.style.paddingTop = '0';
                mainContainer.style.paddingRight = '0';
                mainContainer.style.boxShadow = 'none';
              }
              
              const innerContent = document.querySelector('.gm-style-iw-c > div');
              if (innerContent) {
                innerContent.style.padding = '0';
                innerContent.style.paddingTop = '0';
                innerContent.style.paddingRight = '0';
                innerContent.style.margin = '0';
                innerContent.style.borderRadius = '0';
              }
              
              const allContainers = document.querySelectorAll('.gm-style-iw-c, .gm-style-iw-d, .gm-style-iw-c > div, .gm-style-iw-c > div > div');
              allContainers.forEach(container => {
                container.style.paddingTop = '0';
                container.style.paddingRight = '0';
                container.style.borderRadius = '0';
                container.style.boxShadow = 'none';
                if (!container.classList.contains('gm-style-iw-d')) {
                  container.style.padding = '0';
                  container.style.margin = '0';
                }
              });
              
              if (mainContainer) {
                mainContainer.style.borderRadius = '0';
              }
            }, 0);
          });

          marker.addListener('click', () => {
            newInfoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
          newInfoWindows.push(infoWindow);
        }
      });
    } else {
      // Show all individual markers when zoomed in
      locationsWithCoords.forEach((location) => {
        const position = {
          lat: location.latitude,
          lng: location.longitude
        };

        // Determine marker color and size based on rating
        const rating = location.overall || 0;
        const ratingDisplay = rating ? rating.toFixed(1) : '?';
        const markerSize = 40; // Fixed size for consistency
        const markerColor = '#EA3323'; // Red background
        const textColor = '#FDF551'; // Yellow text

        // Create custom marker with rating using SVG
        const markerSvg = `
          <svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2}" fill="${markerColor}" stroke="none"/>
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="'Baloo 2', sans-serif" font-size="14" font-weight="bold" fill="${textColor}">${ratingDisplay}</text>
          </svg>
        `;
        
        const markerImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg);

        // Create custom marker
        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: location.name.split(',')[0],
          icon: {
            url: markerImage,
            scaledSize: new window.google.maps.Size(markerSize, markerSize),
            anchor: new window.google.maps.Point(markerSize/2, markerSize/2)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: Math.round(rating * 10) // Higher ratings appear on top
        });

        // Create info window content
        const locationSlug = createLocationSlug(location.name);
        const locationName = location.name.split(',')[0];
        const infoContent = `
          <div style="padding: 8px 12px 8px 12px; margin: 0; min-width: 200px; box-sizing: border-box; border-radius: 0; box-shadow: none; background-color: white;">
            <h3 style="margin: 0 0 6px 0; padding: 0; font-weight: 400; font-size: 24px; font-family: 'Rouge Script', cursive; color: #000000;">${locationName}</h3>
            <div style="display: flex; align-items: center; justify-content: space-between; margin: 0; padding: 0; gap: 12px; width: 100%;">
              <span style="color: #666; font-size: 16px; margin: 0; padding: 0; font-family: 'Baloo 2', sans-serif; font-weight: 500;">
                ${location.totalPosts || 0} reviews
              </span>
              <a 
                href="/location/${locationSlug}" 
                style="color: #EA3323; text-decoration: underline; font-size: 16px; font-weight: 600; margin: 0; padding: 0; font-family: 'Baloo 2', sans-serif; white-space: nowrap;"
              >
                See Details
              </a>
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });

        // Hide close button and reduce padding
        infoWindow.addListener('domready', () => {
          setTimeout(() => {
            // Hide the close button (X icon)
            const closeButton = document.querySelector('.gm-ui-hover-effect');
            if (closeButton) {
              closeButton.style.display = 'none';
            }
            
            // Remove all padding from InfoWindow containers - target top and right specifically
            const contentDiv = document.querySelector('.gm-style-iw-d');
            if (contentDiv) {
              contentDiv.style.padding = '0';
              contentDiv.style.paddingTop = '0';
              contentDiv.style.paddingRight = '0';
              contentDiv.style.paddingBottom = '0';
              contentDiv.style.paddingLeft = '0';
            }
            
            // Also target the main container
            const mainContainer = document.querySelector('.gm-style-iw.gm-style-iw-c');
            if (mainContainer) {
              mainContainer.style.padding = '0';
              mainContainer.style.paddingTop = '0';
              mainContainer.style.paddingRight = '0';
              mainContainer.style.boxShadow = 'none';
            }
            
            // Target inner content wrapper
            const innerContent = document.querySelector('.gm-style-iw-c > div');
            if (innerContent) {
              innerContent.style.padding = '0';
              innerContent.style.paddingTop = '0';
              innerContent.style.paddingRight = '0';
              innerContent.style.margin = '0';
              innerContent.style.borderRadius = '0';
            }
            
            // Target all containers and remove top/right padding, border radius, and shadow
            const allContainers = document.querySelectorAll('.gm-style-iw-c, .gm-style-iw-d, .gm-style-iw-c > div, .gm-style-iw-c > div > div');
            allContainers.forEach(container => {
              container.style.paddingTop = '0';
              container.style.paddingRight = '0';
              container.style.borderRadius = '0';
              container.style.boxShadow = 'none';
              if (!container.classList.contains('gm-style-iw-d')) {
                container.style.padding = '0';
                container.style.margin = '0';
              }
            });
            
            // Also remove border radius from main container
            if (mainContainer) {
              mainContainer.style.borderRadius = '0';
            }
          }, 0);
        });

        marker.addListener('click', () => {
          // Close all other info windows
          newInfoWindows.forEach(iw => iw.close());
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        newInfoWindows.push(infoWindow);
      });
    }

    setMarkers(newMarkers);
    setInfoWindows(newInfoWindows);
    setClusterMarkers(newClusterMarkers);
    infoWindowsRef.current = newInfoWindows;

    // Check if locations have actually changed (not just zoom)
    // Create a simple string representation for comparison
    const currentLocationsKey = filteredLocations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => `${loc.id || loc.name || ''}-${loc.latitude}-${loc.longitude}`)
      .sort()
      .join('|');
    
    const previousLocationsKey = previousLocationsRef.current;
    const locationsChanged = previousLocationsKey === null || previousLocationsKey !== currentLocationsKey;

    // Fit map bounds to show all markers/clusters only when locations change
    // Don't fit bounds when zoom changes, as that would reset the user's zoom level
    if ((newMarkers.length > 0 || newClusterMarkers.length > 0) && locationsChanged) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      newClusterMarkers.forEach(cluster => {
        bounds.extend(cluster.getPosition());
      });
      map.fitBounds(bounds);
      
      // Don't zoom in too much if there's only one marker
      // Use a timeout to avoid triggering zoom_changed listener during effect
      if (newMarkers.length === 1 && newClusterMarkers.length === 0) {
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (currentZoom > 15) {
            map.setZoom(15);
          }
        }, 100);
      }
    }

    // Update the previous locations reference
    previousLocationsRef.current = currentLocationsKey;
  }, [map, filteredLocations, mapZoom]);

  if (error) {
    return (
      <div className="overflow-hidden rounded-xl text-center flex items-center justify-center px-6" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--light-blue-custom)', height: '420px' }}>
        <p className="text-gray-800 font-baloo2 text-lg">Error loading map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="overflow-hidden rounded-xl text-center flex items-center justify-center px-6" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--light-blue-custom)', height: '420px' }}>
        <p className="text-gray-800 font-baloo2 text-lg">Loading map...</p>
      </div>
    );
  }

  const locationsWithCoords = filteredLocations.filter(loc => loc.latitude && loc.longitude);

  if (locationsWithCoords.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl text-center flex items-center justify-center px-6" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', backgroundColor: 'var(--light-blue-custom)', height: '420px' }}>
        <p className="text-gray-800 font-baloo2 text-lg">No locations with coordinates available to display on map</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full rounded-xl overflow-hidden"
      style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black', height: '420px' }}
    />
  );
}


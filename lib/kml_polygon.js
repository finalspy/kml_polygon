/*
 *The MIT License
 *
 * Copyright (c) 2007 Nick Galbreath, (c) 2013 Matthew Brookes, (c) 2013 Yann Petit
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Version 0.0.1 - 13-Jun-2013 Port to JS
 */

function drwZone(lat,lon,radius){
  //constant to convert to degrees
  var DEGREES = 180.0 / Math.PI;
  // constant to convert to radians
  var RADIANS = Math.PI / 180.0;
  // Mean Radius of Earth in meters
  var EARTH_MEAN_RADIUS = 6371.0 * 1000;

  // Convert [x,y,z] on unit sphere back to [longitude, latitude])
  function  to_earth(point){
    point[0] == 0.0 ? lon = Math.PI / 2.0 :lon = Math.atan(point[1]/point[0]);
    lat = Math.PI / 2.0 - Math.acos(point[2]);
    if (point[0] < 0.0){
      // select correct branch of arctan
      lon = (point[1] <= 0.0) ? lon - Math.PI : Math.PI + lon; 
    }
    return [lon * DEGREES, lat * DEGREES];
  }

  // Convert [longitude, latitude] IN RADIANS to 
  // spherical / cartesian [x,y,z]
  function  to_cartesian(coord){
    theta = coord[0];
    // spherical coordinate use "co-latitude", not "latitude"
    // lat = [-90, 90] with 0 at equator
    // co-lat = [0, 180] with 0 at north pole
    phi = Math.PI / 2.0 - coord[1];
    return [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)]
  }

  // spoints -- get raw list of points in longitude,latitude format
  // radius: radius of polygon in meters
  // sides:  number of sides
  // rotate: rotate polygon by number of degrees
  // Returns a list of points comprising the object
  function  spoints(lon, lat, radius, sides, rotate){
    if(null == sides) sides = 20;
    if(null == rotate) rotate = 0;
    rotate_radians = rotate * RADIANS;
    // compute longitude degrees (in radians) at given latitude
    r = radius / (EARTH_MEAN_RADIUS * Math.cos(lat * RADIANS));
    vector = to_cartesian([lon * RADIANS, lat * RADIANS]);
    point = to_cartesian([lon * RADIANS + r, lat * RADIANS]);
    points = [];
    for (var side = 0; side < sides; side++){
      points.push(to_earth(rotate_point(vector, point, rotate_radians + (2.0 * Math.PI/sides)*side)));
    }
    // Connect to starting point exactly
    // Not sure if required, but seems to help when the polygon is not filled
    //points = points[0];
    return points;
  }

// rotate point around unit vector by phi radians
// http://blog.modp.com/2007/09/rotating-point-around-vector.html
  function  rotate_point(vector, point, phi){
    // remap vector for sanity
    u = vector[0];
    v = vector[1];
    w = vector[2];
    x = point[0];
    y = point[1];
    z = point[2];
    a = u*x + v*y + w*z;
    d = Math.cos(phi);
    e = Math.sin(phi);
    return [(a*u + (x - a*u)*d + (v*z - w*y) * e),
     (a*v + (y - a*v)*d + (w*x - u*z) * e),
     (a*w + (z - a*w)*d + (u*y - v*x) * e)];
  }

  // Output points formatted as a KML string
  // You may want to edit this function to change "extrude" and other XML nodes.
  function  points_to_kml(points){
    kml_string = "<Polygon>\n";
    kml_string += "  <outerBoundaryIs><LinearRing><coordinates>\n";
    for(p in points){
       console.log(points[p]);
      kml_string += "    " + points[p][0] + "," + points[p][1] + "\n";
    }
    kml_string += "  </coordinates></LinearRing></outerBoundaryIs>\n";
    kml_string += "</Polygon>\n";
    // kml_string << "  <extrude>1</extrude>\sides"
    // kml_string << "  <altitudeMode>clampToGround</altitudeMode>\sides"
    return kml_string;
  }

// kml_regular_polygon    - Regular polygon
//  (lon, lat)            - center point in decimal degrees
//  radius                - radius in meters
//  segments              - number of sides, > 20 looks like a circle (optional, function ault: 20){
//  rotate                - rotate polygon by number of degrees (optional, function ault: 0){
// Returns a string suitable for adding into a KML file.
  function  kml_regular_polygon(lon, lat, radius, segments, rotate){
    if(null == segments) sides = 20;
    if(null == rotate) rotate = 0;
    return points_to_kml(spoints(lon, lat, radius, segments, rotate));
  }

//
// kml_star - Make a "star" or "burst" pattern
//
//  (lon, lat)            - center point in decimal degrees
//  radius                - radius in meters
//  innner_radius         - radius in meters, typically < outer_radius
//  segments              - number of "points" on the star (optional, function ault: 10){
//  rotate                - rotate polygon by number of degrees (optional, function ault: 0){
//
// Returns a string suitable for adding into a KML file.
//
/*
  function  kml_star(lon, lat, radius, inner_radius, segments=10, rotate=0){
    outer_points = spoints(lon, lat, radius, segments, rotate)
    inner_points = spoints(lon, lat, inner_radius, segments, rotate + 180.0 / segments)
    // interweave the radius and inner_radius points
    // I'm sure there is a better way
    points = []
    for point in 0...outer_points.length
      points << outer_points[point]
      points << inner_points[point]
    }
    // MTB - Drop the last overlapping point leaving start and } points connecting
    // (resulting output differs from orig, but is more correct)
    points.pop
    points_to_kml(points)
  }
  */
  return kml_regular_polygon(lat, lon, radius);

}

//
// Example
//
// drwZone(-1.68521,48.1077, 70000)
// console.log((drwZone(-1.68521,48.1077, 70000)));


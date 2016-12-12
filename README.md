# raster-streamlines

Convert a vectorial raster field into streamlines. The output is in a convenient GeoJSON format compatible with [d3js](d3js.org) mapping.

INSTALL
=======

To use with npm, just type

  npm install raster-streamlines

USAGE
=====

To create the streamlines, a vectorial field is needed:

    var srteamlines = require("raster-streamlines");
    var properties = srteamlines.streamlines(u, v, geotransform, flip);

* u is the speed in the x coordinates, where positive numbers go from right to left, as in the wind conventions
* v is the speed in the x coordinates, where positive numbers go from lower to upper, as in the wind conventions
* u and v must have the same dimensions, obviously
* geotransform is a six elements array, as defined in the [gdal library](http://www.gdal.org/gdal_datamodel.html). It's an optional parameter, the array position coordinates are used if the array is not given
* flip  is an optional parameter to change the v speed direction if set to true

When using directly in HTML, use the *rastertools* as the namespace

  rastertools.streamlines(u, v, geotransform, flip);
  
EXAMPLE
=======

See [this block](http://bl.ocks.org/rveciana/edb1dd43f3edc5d16ecaf4839c032dec) for a real world usage.

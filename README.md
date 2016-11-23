[![Build Status](https://travis-ci.org/rveciana/raster-streamlines.svg?branch=master)](https://travis-ci.org/rveciana/raster-streamlines)
[![Coverage Status](https://coveralls.io/repos/github/rveciana/raster-streamlines/badge.svg?branch=master)](https://coveralls.io/github/rveciana/raster-streamlines?branch=master)

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
    var properties = srteamlines.streamlines(u, v, geotransform);

* u is the speed in the x coordinates, where positive numbers go from right to left, as in the wind conventions.  
* v is the speed in the x coordinates, where positive numbers go from upper to lower, as in the wind conventions.
* u and v must have the same dimensions, obviously.
* geotransform is a six elements array, as defined in the [gdal library](http://www.gdal.org/gdal_datamodel.html). It's an optional parameter, the array position coordinates are used if the array is not given.

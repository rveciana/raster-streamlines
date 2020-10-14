// raster-streamlines Version 0.1.0. Copyright 2020 Roger Veciana i Rovira.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.rastertools = global.rastertools || {})));
}(this, (function (exports) { 'use strict';

var streamlines = function(uData, vData, geotransform, density, flip) {
  density = density || 1;
  var output = {
    "type": "FeatureCollection",
    "features": []
  };
  var num_lines = 0;
  var inst = new Streamlines(uData, vData);
  if(geotransform && geotransform.length !== 6){
    throw new Error('Bad geotransform');
  }

  //The density affects the pixel distance
  const pixelDist = Math.round(inst.ySize / (60 * density)) || 1;

  // Iterate over all grid points in pseudo-random order and try to start a line there
  var N = inst.xSize * inst.ySize;
  for(var pos = 0; pos < N; pos++){
    var n = (pos * 327685) % N; // We trust that this large prime doesn't divide either dimension.
    var x = Math.trunc(n / inst.ySize);
    var y = n % inst.ySize;
    if(inst.isPixelFree(x, y, pixelDist)){
      var line = inst.getLine(x, y, flip);
      if(line){
        output.features.push({
          "type": "Feature",
          "geometry": {
            "type": "LineString",
            "coordinates": inst.applyGeoTransform(line, geotransform)
          },
          "properties": { "num_line": num_lines }
        });
        num_lines++;
      }
    }
  }
  return output;
};

function Streamlines(uData, vData){
  if(uData.length <= 1 || vData.length <= 1 || uData[0].length <= 1 || vData[0].length <= 1){
    throw new Error('Raster is too small');
  }
  if(uData.length !== vData.length || uData[0].length !== vData[0].length){
    throw new Error('Raster components are not the same shape');
  }
  this.uData = uData;
  this.vData = vData;
  this.xSize = this.uData[0].length;
  this.ySize = this.uData.length;
  this.usedPixels = new Array(this.ySize);
  for(var y = 0; y<this.ySize; y++){
    this.usedPixels[y] = new Array(this.xSize).fill(false);
  }
}

Streamlines.prototype.isPixelFree = function(x0, y0, dist) {
  if(x0<0 || x0>=this.xSize || y0<0 || y0 >= this.ySize){
    return false;
  }
  const xLow = Math.max(x0-dist, 0);
  const xHigh = Math.min(x0+dist, this.xSize-1);
  const yLow = Math.max(y0-dist, 0);
  const yHigh = Math.min(y0+dist, this.ySize-1);
  for(var x=xLow; x<=xHigh; x++){
    for(var y = yLow; y <= yHigh; y++){
      if(this.usedPixels[y][x]){
        return false;
      }
    }
  }

  return true;
};

Streamlines.prototype.getLine = function(x0, y0, flip) {

  var lineFound = false;
  var x = x0;
  var y = y0;
  var x_, y_;
  var values;
  var outLine = [[x,y]];
  flip = flip ? 1 : -1;
  while(x >= 0 && x < this.xSize && y >= 0 && y < this.ySize){
    values = this.getValueAtPoint(x, y);
    if(values.u === 0 && values.v === 0){this.usedPixels[y0][x0] = true; break;} //Zero speed points are problematic

    x += values.u;
    y += flip * values.v; //The wind convention says v goes from bottom to top
    y_ = Math.floor(y);
    x_ = Math.floor(x);
    if(x < 0 || y < 0 || x>= this.xSize || y >= this.ySize || this.usedPixels[y_][x_]){break;}
    outLine.push([x,y]);
    lineFound = true;
    this.usedPixels[y_][x_] = true;
  }
  //repeat the operation but backwards, so strange effects in some cases are avoided.
  x = x0;
  y = y0;
  while(x >= 0 && x < this.xSize && y >= 0 && y < this.ySize){
    values = this.getValueAtPoint(x, y);
    if(values.u === 0 && values.v === 0){this.usedPixels[y0][x0] = true; break;} //Zero speed points are problematic

    x -= values.u;
    y -= flip * values.v; //The wind convention says v goes from bottom to top
    y_ = Math.floor(y);
    x_ = Math.floor(x);
    if(x < 0 || y < 0 || x>= this.xSize || y >= this.ySize || this.usedPixels[y_][x_]){break;}
    outLine.unshift([x,y]);
    lineFound = true;
    this.usedPixels[y_][x_] = true;
  }

  if(lineFound){
    this.usedPixels[y0][x0] = true;
    return outLine;
  } else {
    return false;
  }
};

Streamlines.prototype.applyGeoTransform = function(line, geotransform) {
  if(geotransform == null){
    return line;
  }

  function tr(p) {
    return [
      geotransform[0] + geotransform[1] * p[0] + geotransform[2] * p[1],
      geotransform[3] + geotransform[4] * p[0] + geotransform[5] * p[1]
    ];
  }

  return line.map(tr);
};

function minmax(x, min, max) {
  return x<=min ? min : x>=max ? max : x;
}

/** Get a {u,v} speed vector at the fractional index [x,y] in our U,V grid */
Streamlines.prototype.getValueAtPoint = function(x, y) {
  // x/y indices below and above the cell to interpolate in.
  // If minmax affects an index then we're on or outside the border
  // and we will do implicit linear extrapolation out to any distance.
  const x0 = minmax(Math.floor(x), 0, this.xSize-2);
  const x1 = x0+1;
  const y0 = minmax(Math.floor(y), 0, this.ySize-2);
  const y1 = y0+1;

  // Linear weights along x/y axes
  const xw1 = x-x0;
  const xw0 = 1-xw1;
  const yw1 = y-y0;
  const yw0 = 1-yw1;

  // Bi-linear weights of the 4 corner points
  const pw00 = yw0*xw0;
  const pw01 = yw1*xw0;
  const pw10 = yw0*xw1;
  const pw11 = yw1*xw1;

  const u = (
    this.uData[y0][x0]*pw00+this.uData[y0][x1]*pw01+
    this.uData[y1][x0]*pw10+this.uData[y1][x1]*pw11
  );
  const v = (
    this.vData[y0][x0]*pw00+this.vData[y0][x1]*pw01+
    this.vData[y1][x0]*pw10+this.vData[y1][x1]*pw11
  );

  // Scale u,v vector to unit length (but leave 0-vector alone)
  const mdl = Math.sqrt(u*u+v*v) || 1;
  return { u: u/mdl, v: v/mdl };
};

exports.streamlines = streamlines;

Object.defineProperty(exports, '__esModule', { value: true });

})));

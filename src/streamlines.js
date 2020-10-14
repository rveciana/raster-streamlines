export var streamlines = function(uData, vData, geotransform, density, flip){
  density = density || 1;
  var output = { "type": "FeatureCollection",
    "features": []
  };
  var num_lines = 0;
  var inst = new Streamlines(uData, vData);
  if(!geotransform){
    geotransform = [0,1,0,0,0,1];
  } else if(geotransform.length !== 6){
    throw new Error('Bad geotransform');
  }
  //Iterate different points to start lines while available pixels
  var pixel = true;
  var line = true;

  var pos = 0;
  var x, y;
  while(pixel){
    if(pos%4 === 0){
      x = 0;
      y = 0;
    } else if(pos%4 === 1){
      x = uData[0].length - 1;
      y = uData.length - 1;
    } else if(pos%4 === 2){
      x = uData[0].length - 1;
      y = 0;
    } else{
      x = 0;
      y = uData.length - 1;
    }
    //The density affects the pixel distance
    var pixelDist = Math.round(uData.length / (60 * density));
    pixelDist = pixelDist>0?pixelDist:1;

    pixel = inst.findEmptyPixel(x,y,pixelDist);
    line = inst.getLine(pixel.x, pixel.y, flip);
    if(line){
      output.features.push({"type": "Feature",
         "geometry": {
           "type": "LineString",
          "coordinates": inst.applyGeoTransform(line, geotransform)},
          "properties": {"num_line": num_lines}
        });
      num_lines++;
    }
    pos++;
  }
  return output;
};

function Streamlines(uData, vData){
  if(uData.length <= 1 || vData.length <= 1 || uData[0].length <= 1 || vData[0].length <= 1){
    throw new Error('Raster is too small');
  }
  this.uData = uData;
  this.vData = vData;
  this.xSize = this.uData[0].length;
  this.ySize = this.uData.length;
  this.usedPixels = [];
  for(var i = 0; i<uData.length; i++){
    var line = [];
    for(var j = 0; j<uData[0].length; j++){
      line.push(false);
    }
    this.usedPixels.push(line);
  }
}

Streamlines.prototype.findEmptyPixel = function(x0, y0, dist) {
  //Explores around the init pixel creating squares to find an empty pixel
  if(this.isPixelFree(x0, y0, dist)){
    return {x:x0, y:y0};
  }
  var maxDist = this.uData[0].length + this.uData.length;
  for(var d = 2; d <= maxDist + 1; d=d+2){
    for(var pd = 0; pd<d; pd++){
      if(this.isPixelFree(pd+1+x0-d/2, y0-d/2, dist)){return {x:pd+1+x0-d/2, y:y0-d/2};}
      if(this.isPixelFree(x0-d/2, pd+y0-d/2, dist)){return {x:x0-d/2, y:pd+y0-d/2};}
      if(this.isPixelFree(d+x0-d/2, pd+1+y0-d/2, dist)){return {x:d+x0-d/2, y:pd+1+y0-d/2};}
      if(this.isPixelFree(pd+x0-d/2, d+y0-d/2, dist)){return {x:pd+x0-d/2, y:d+y0-d/2};}
    }

  }
  return false;
};

Streamlines.prototype.isPixelFree = function(x0, y0, dist) {
  if(x0<0 || x0>=this.usedPixels[0].length || y0<0 || y0 >= this.usedPixels.length){
    return false;
  }
  for(var i=-dist; i<=dist;i++){
    for(var j=-dist; j<=dist;j++){
      if(y0+j>=0 &&y0+j<this.usedPixels.length && x0+i>=0 && x0+i<this.usedPixels[y0].length){
        if(this.usedPixels[y0+j][x0+i]){
          return false;
        }
      }
    }
  }

  return true;
};

Streamlines.prototype.getLine = function(x0, y0, flip) {

  var lineFound = false;
  var x = x0;
  var y = y0;
  var values;
  var outLine = [[x,y]];
  if(flip){flip = 1;} else {flip = -1;}
  while(x >= 0 && x < this.xSize && y >= 0 && y < this.ySize){
    values = this.getValueAtPoint(x, y);

    x = x + values.u;
    y = y + flip * values.v; //The wind convention says v goes from bottom to top
    if(values.u === 0 && values.v === 0){this.usedPixels[y0][x0] = true; break;} //Zero speed points are problematic
    if(x < 0 || y < 0 || x>= this.xSize || y >= this.ySize || this.usedPixels[Math.floor(y)][Math.floor(x)]){break;}
    outLine.push([x,y]);
    lineFound = true;
    this.usedPixels[Math.floor(y)][Math.floor(x)] = true;
  }
  //repeat the operation but backwards, so strange effects in some cases are avoided.
  x = x0;
  y = y0;
  while(x >= 0 && x < this.uData[0].length && y >= 0 && y < this.uData.length){
    values = this.getValueAtPoint(x, y);

    x = x - values.u;
    y = y - flip * values.v; //The wind convention says v goes from bottom to top
    if(values.u === 0 && values.v === 0){this.usedPixels[y0][x0] = true; break;} //Zero speed points are problematic
    if(x < 0 || y < 0 || x>= this.xSize || y >= this.ySize || this.usedPixels[Math.floor(y)][Math.floor(x)]){break;}
    outLine.unshift([x,y]);
    lineFound = true;
    this.usedPixels[Math.floor(y)][Math.floor(x)] = true;
  }

  if(lineFound){
    this.usedPixels[y0][x0] = true;
    return outLine;
  } else {
    return false;
  }
};

Streamlines.prototype.applyGeoTransform = function(line, geotransform) {
  var outLine = [];
  for(var i = 0; i<line.length; i++){
    outLine.push([geotransform[0] + geotransform[1] * line[i][0] + geotransform[2] * line[i][1], geotransform[3] + geotransform[4] * line[i][0] + geotransform[5] * line[i][1]]);
  }
  return outLine;
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

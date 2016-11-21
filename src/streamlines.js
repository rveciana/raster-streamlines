export var streamlines = function(uData, vData, geotransform){
  var output = [];
  var inst = new Streamlines(uData, vData);
  if(!geotransform){
    geotransform = [0,1,0,0,0,1];
  } else if(geotransform.length != 6){
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
    pixel = inst.findEmptyPixel(x,y,1);
    line = inst.getLine(pixel.x, pixel.y, geotransform);
    if(line){
      output.push(line);
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
  var maxDist = Math.max.apply(Math, [x0, y0, Math.abs(x0 - this.uData[0].length), Math.abs(y0 - this.uData.length)]);
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

Streamlines.prototype.getLine = function(x0, y0, geotransform) {
  if(!geotransform){
    throw new Error('No GeoTransform given');
  }
  var lineFound = false;
  var x = x0;
  var y = y0;
  var outLine = [this.applyGeoTransform(x, y, geotransform)];
  while(x >= 0 && x < this.uData[0].length && y >= 0 && y < this.uData.length){
    var values = this.getValueAtPoint(x, y);
    x = x + values.u;
    y = y + values.v;
    if(x < 0 || y < 0 || x>= this.uData[0].length || y >= this.uData.length || this.usedPixels[Math.floor(y)][Math.floor(x)]){break;}
    outLine.push(this.applyGeoTransform(x, y, geotransform));
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

Streamlines.prototype.applyGeoTransform = function(x, y, geotransform) {
  return [geotransform[0] + geotransform[1] * x + geotransform[2] * y, geotransform[3] + geotransform[4] * x + geotransform[5] * y];
};

Streamlines.prototype.getValueAtPoint = function(x, y) {
  var u, v, mdl;
  var dist1 = Math.sqrt((Math.floor(x) - x) * (Math.floor(x) - x) + (Math.floor(y) - y) * (Math.floor(y) - y));
  var dist2 = Math.sqrt((Math.floor(x) - x) * (Math.floor(x) - x) + (Math.ceil(y) - y) * (Math.ceil(y) - y));
  var dist3 = Math.sqrt((Math.ceil(x) - x) * (Math.ceil(x) - x) + (Math.ceil(y) - y) * (Math.ceil(y) - y));
  var dist4 = Math.sqrt((Math.ceil(x) - x) * (Math.ceil(x) - x) + (Math.floor(y) - y) * (Math.floor(y) - y));
  if(dist1 < 0.0000001){
    u = this.uData[Math.floor(y)][Math.floor(x)];
    v = this.vData[Math.floor(y)][Math.floor(x)];
  } else if(dist2 < 0.0000001){
    u = this.uData[Math.ceil(y)][Math.floor(x)];
    v = this.vData[Math.ceil(y)][Math.floor(x)];
  } else if(dist3 < 0.0000001){
    u = this.uData[Math.ceil(y)][Math.ceil(x)];
    v = this.vData[Math.ceil(y)][Math.ceil(x)];
  } else if(dist4 < 0.0000001){
    u = this.uData[Math.floor(y)][Math.ceil(x)];
    v = this.vData[Math.floor(y)][Math.ceil(x)];
  } else {
    u = ((this.uData[Math.floor(y)][Math.floor(x)]/dist1)+
    (this.uData[Math.ceil(y)][Math.floor(x)]/dist2)+
    (this.uData[Math.ceil(y)][Math.ceil(x)]/dist3)+
    (this.uData[Math.floor(y)][Math.ceil(x)]/dist4))/
    ((1/dist1)+(1/dist2)+(1/dist3)+(1/dist4));


    v = ((this.vData[Math.floor(y)][Math.floor(x)]/dist1)+
    (this.vData[Math.ceil(y)][Math.floor(x)]/dist2)+
    (this.vData[Math.ceil(y)][Math.ceil(x)]/dist3)+
    (this.vData[Math.floor(y)][Math.ceil(x)]/dist4))/
    ((1/dist1)+(1/dist2)+(1/dist3)+(1/dist4));
  }
  mdl = Math.sqrt(u*u+v*v);
  return {u:u/mdl, v:v/mdl};
};

export var streamlines = function(uData, vData){
  var output = [];
  var inst = new Streamlines(uData, vData);
  output.push(inst.getLine(0, 0));
  console.info("-----", inst.findEmptyPixel(3,3,1));
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
  var pixel = this.isPixelFree(x0, y0, dist);

  for(var d = 2; d <= 5; d=d+2){
    if(pixel){break;}
    for(var pd = 0; pd<d; pd++){
      pixel = this.isPixelFree(pd+1+x0-d/2, y0-d/2, dist);
      if(pixel){break;}
      pixel = this.isPixelFree(x0-d/2, pd+y0-d/2, dist);
      if(pixel){break;}
      pixel = this.isPixelFree(d+x0-d/2, pd+1+y0-d/2, dist);
      if(pixel){break;}
      pixel = this.isPixelFree(pd+x0-d/2, d+y0-d/2, dist);
    }

  }

  return pixel;
};

Streamlines.prototype.isPixelFree = function(x0, y0, dist) {
  console.info(x0, y0, dist);
  var result = false;
  if(x0<0 || x0>=this.usedPixels[0].length || y0<0 || y0 >= this.usedPixels.length){
    return result;
  }

  for(var i=-dist; i<=dist;i++){
    if(result){break;}
    for(var j=-dist; j<=dist;j++){
      if(result){break;}
      if(y0+j>=0 &&y0+j<this.usedPixels.length && x0+i>=0 && x0+i<this.usedPixels[y0].length){
        if(this.usedPixels[y0+j][x0+i]){
          result = {x: x0+i, y:y0+j};
        }
      }
    }
  }

  return result;
};

Streamlines.prototype.getLine = function(x, y) {
  var outLine = [[x, y]];
  while(x >= 0 && x < this.uData[0].length - 1 && y >= 0 && y < this.uData.length - 1){
    var values = this.getValueAtPoint(x, y);
    x = x + values.u;
    y = y + values.v;
    outLine.push([x, y]);
    this.usedPixels[Math.floor(y)][Math.floor(x)] = true;
  }
  console.log(this.usedPixels);
  return outLine;
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

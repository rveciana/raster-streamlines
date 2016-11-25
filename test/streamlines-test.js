var tape = require("tape"),
geotiff = require("geotiff"),
streamlines = require("../"),
fs = require("fs");

tape("Testing the most simple streamlines", function(test) {
  var data;

  data = createSimpleMatrix(0, 1, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 0, 2 ], [ 0, 1 ], [ 0, 0 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 2, 2 ], [ 2, 1 ], [ 2, 0 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });


  data = createSimpleMatrix(0, -1, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 0, 0 ], [ 0, 1 ], [ 0, 2 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 2, 0 ], [ 2, 1 ], [ 2, 2 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });


  data = createSimpleMatrix(1, 0, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 0, 2 ], [ 1, 2 ], [ 2, 2 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });


  data = createSimpleMatrix(-1, 0, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 2, 0 ], [ 1, 0 ], [ 0, 0 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 2, 2 ], [ 1, 2 ], [ 0, 2 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });


  //Test geotransform
  test.deepEqual(streamlines.streamlines(data.u, data.v, [1,1,0,0,0,1]),
  { features: [ { geometry: { coordinates: [ [ 3, 0 ], [ 2, 0 ], [ 1, 0 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 3, 2 ], [ 2, 2 ], [ 1, 2 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });

  //Testing an absolute no-wind
  data = createSimpleMatrix(0, 0, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),{ features: [], type: 'FeatureCollection' });

  test.end();
});

tape("Testing errors", function(test) {
  var data = createSimpleMatrix(0.5, 1, 1, 1);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

  data = createSimpleMatrix(0.5, 1, 1, 2);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

  data = createSimpleMatrix(0.5, 1, 2, 1);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

  data = createSimpleMatrix(0.5, 1, 5, 5);
  test.throws(function() {streamlines.streamlines(data.u, data.v, [1]);}, /Bad geotransform/, "Should throw typeError");

  test.end();
});

tape("Testing complex examples", function(test) {

  var tiffData = fs.readFileSync("test/samples/wrf.tiff");
  var arrayBuffer = tiffData.buffer.slice(tiffData.byteOffset, tiffData.byteOffset + tiffData.byteLength);
  var tiff = geotiff.parse(arrayBuffer);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var dataU = new Array(image.getHeight());
  var dataV = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      dataU[j] = new Array(image.getWidth());
      dataV[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          dataU[j][i] = rasters[0][i + j*image.getWidth()];
          dataV[j][i] = rasters[1][i + j*image.getWidth()];
      }
  }

  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];
  var lines = streamlines.streamlines(dataU,dataV, geoTransform);

  test.equals(lines.features.length, 151, "Correct number of streamlines is 149");

  test.end();
});

function createSimpleMatrix(uVal, vVal, xSize, ySize){
  var dataU = [];
  var dataV = [];
  for(var i = 0; i<ySize; i++){
    var lineU = [];
    var lineV = [];
    for(var j = 0; j<xSize; j++){
      lineU.push(uVal);
      lineV.push(vVal);
    }
    dataU.push(lineU);
    dataV.push(lineV);
  }
  return {u: dataU, v: dataV};
}

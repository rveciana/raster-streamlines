var tape = require("tape"),
geotiff = require("geotiff"),
streamlines = require("../"),
fs = require("fs");

tape("Testing the most simple streamlines", function(test) {
  var data;

  data = createSimpleMatrix(0, 1, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 0, 0 ], [ 0, 1 ], [ 0, 2 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 2, 0 ], [ 2, 1 ], [ 2, 2 ] ], type: 'LineString' },
  properties: { num_line: 1 }, type: 'Feature' } ], type: 'FeatureCollection' });


  data = createSimpleMatrix(0, -1, 3, 3);
  test.deepEqual(streamlines.streamlines(data.u, data.v),
  { features: [ { geometry: { coordinates: [ [ 0, 2 ], [ 0, 1 ], [ 0, 0 ] ], type: 'LineString' }, properties: { num_line: 0 }, type: 'Feature' },
  { geometry: { coordinates: [ [ 2, 2 ], [ 2, 1 ], [ 2, 0 ] ], type: 'LineString' },
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

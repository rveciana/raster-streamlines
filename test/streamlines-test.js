var tape = require("tape"),
streamlines = require("../");

tape("Testing the most simple streamlines", function(test) {
  var data = createSimpleMatrix(0.5, 1, 3, 3);
  console.info(streamlines.streamlines(data.u, data.v));
  test.end();
});

tape("Testing errors", function(test) {
  var data = createSimpleMatrix(0.5, 1, 1, 1);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

  data = createSimpleMatrix(0.5, 1, 1, 2);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

  data = createSimpleMatrix(0.5, 1, 2, 1);
  test.throws(function() {streamlines.streamlines(data.u, data.v);}, /Raster is too small/, "Should throw typeError");

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

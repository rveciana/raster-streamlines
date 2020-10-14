var fs = require("fs"),
    Canvas = require("canvas"),
    d3_geo = require("d3-geo"),
    geotiff = require("geotiff"),
    topojson = require("topojson-client"),
    streamlines = require("../");


var width = 960,
    height= 500;

var canvas = new Canvas(width, height),
context = canvas.getContext("2d");

var projection = d3_geo.geoConicConformal()
    .rotate([82, 0])
    .center([0, 34.83158])
    .parallels([30, 60])
    .scale(2300)
    .translate([width / 2, height / 2]);

var path = d3_geo.geoPath()
    .projection(projection)
    .context(context);

var topojsonData = JSON.parse(fs.readFileSync("test/samples/world-110m.json", "utf-8"));
context.beginPath();
context.strokeStyle = "#8a8";
context.lineWidth = 3;
path(topojson.mesh(topojsonData));
context.stroke();
context.lineWidth = 1;

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

  lines.features.forEach(function(d) {
    context.beginPath();
    context.strokeStyle = "#000000";
    path(d);
    context.stroke();
  });

fs.writeFileSync('/tmp/data.json', JSON.stringify(lines, null, 2) , 'utf-8');

console.warn("↳ test/output/streamlines.png");
canvas.pngStream().pipe(fs.createWriteStream("test/output/streamlines.png"));

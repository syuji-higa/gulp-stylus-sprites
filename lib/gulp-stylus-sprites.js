'use strict';
var _through = require('through2');
var _through2 = _interopRequireDefault(_through);
var _gulpUtil = require('gulp-util');
var _path = require('path');
var _lodash = require('lodash');
var _fs = require('fs');
var _spritesmith = require('spritesmith');
var _spritesmith2 = _interopRequireDefault(_spritesmith);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var PLUGIN_NAME = 'gulp-stylus-sprites';
var EXTNAMES = ['.png', '.jpg', '.jpeg', '.gif'];
var defOpts = {
  imgSrcBase: 'sprite',
  stylusFileName: 'sprite',
  spritesmithOpts: {}
};
var filesDataCache = {};
module.exports = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _defaults = (0, _lodash.defaults)(opts, defOpts),
      imgSrcBase = _defaults.imgSrcBase,
      stylusFileName = _defaults.stylusFileName,
      spritesmithOpts = _defaults.spritesmithOpts;
  var dirGroups = [];
  var spriteHash = {};
  var transform = function transform(file, encode, callback) {
    var _this = this;
    if (file.isNull()) {
      this.push(file);
      callback();
      return;
    }
    if (!file.isBuffer()) return;
    var dirGroup = (0, _path.relative)('', (0, _path.dirname)(file.path));
    if (dirGroups.indexOf(dirGroup) !== -1) {
      callback();
      return;
    }
    dirGroups.push(dirGroup);
    var srcImageFilenames = (0, _lodash.map)((0, _fs.readdirSync)(dirGroup), function (fileName) {
      return (0, _path.join)(dirGroup, fileName);
    });
    srcImageFilenames = (0, _lodash.filter)(srcImageFilenames, function (fileName) {
      return EXTNAMES.some(function (name) {
        return (0, _path.extname)(fileName).toLowerCase() === name;
      });
    });
    var filesData = {};
    (0, _lodash.forEach)(srcImageFilenames, function (fileName) {
      var fileData = (0, _fs.readFileSync)(fileName).toString();
      if (filesDataCache[fileName]) {
        filesData[fileName] = fileData;
      } else {
        filesDataCache[fileName] = fileData;
        filesData[fileName] = null;
      }
    });
    var isChanged = (0, _lodash.some)(filesData, function (val, key) {
      return filesDataCache[key] !== val;
    });
    if (!isChanged) return;
    _spritesmith2.default.run({ src: srcImageFilenames }, function (err, result) {
      if (err) throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
      var fileRootPath = (0, _path.relative)(imgSrcBase, dirGroup + '.png');
      var imageFile = new _gulpUtil.File();
      imageFile.path = fileRootPath;
      imageFile.contents = new Buffer(result.image, 'binary');
      _this.push(imageFile);
      (0, _lodash.forEach)(result.coordinates, function (obj, filePath) {
        var mapKey = (0, _path.relative)(imgSrcBase, filePath);
        spriteHash[mapKey] = (0, _lodash.merge)(obj, {
          url: '/' + fileRootPath
        });
      });
      callback();
    });
  };
  var flush = function flush(callback) {
    this.push(new _gulpUtil.File({
      path: stylusFileName + '.styl',
      contents: new Buffer(createCss(JSON.stringify(spriteHash)))
    }));
    this.emit('end');
    callback();
  };
  var createCss = function createCss(cssHash) {
    if (cssHash) {
      return 'sprite-hash = ' + cssHash + '\n' + mixin();
    } else {
      return '';
    }
  };
  var mixin = function mixin() {
    return 'sprite(filepath, scale = 1)\n  image-hash = sprite-hash[filepath]\n  if !image-hash\n    error(\'Not found image file \' + filepath + \'.\')\n  width: (image-hash.width * scale)px\n  height: (image-hash.height * scale)px\n  url = image-hash.url\n  background: url(url) no-repeat\n  background-position: (-1 * image-hash.x * scale)px (-1 * image-hash.y * scale)px\n  if scale != 1\n    background-size: (image-hash.width * scale)px, (image-hash.height * scale)px\nsprite-retina(filepath)\n  sprite filepath, 0.5';
  };
  return _through2.default.obj({ objectMode: true }, transform, flush);
};
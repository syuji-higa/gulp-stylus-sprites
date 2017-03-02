'use strict';
var _stringify = require('babel-runtime/core-js/json/stringify');
var _stringify2 = _interopRequireDefault(_stringify);
var _getIterator2 = require('babel-runtime/core-js/get-iterator');
var _getIterator3 = _interopRequireDefault(_getIterator2);
var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');
var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
var _entries = require('babel-runtime/core-js/object/entries');
var _entries2 = _interopRequireDefault(_entries);
var _assign = require('babel-runtime/core-js/object/assign');
var _assign2 = _interopRequireDefault(_assign);
var _through = require('through2');
var _through2 = _interopRequireDefault(_through);
var _gulpUtil = require('gulp-util');
var _path = require('path');
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
  var _Object$assign = (0, _assign2.default)({}, defOpts, opts),
      imgSrcBase = _Object$assign.imgSrcBase,
      stylusFileName = _Object$assign.stylusFileName,
      spritesmithOpts = _Object$assign.spritesmithOpts;
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
    var srcImageFilenames = (0, _fs.readdirSync)(dirGroup).map(function (fileName) {
      return (0, _path.join)(dirGroup, fileName);
    });
    srcImageFilenames = srcImageFilenames.filter(function (fileName) {
      return EXTNAMES.some(function (name) {
        return (0, _path.extname)(fileName).toLowerCase() === name;
      });
    });
    var filesData = {};
    srcImageFilenames.forEach(function (fileName) {
      var fileData = (0, _fs.readFileSync)(fileName).toString();
      if (filesDataCache[fileName]) {
        filesData[fileName] = fileData;
      } else {
        filesDataCache[fileName] = fileData;
        filesData[fileName] = null;
      }
    });
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;
    try {
      for (var _iterator = (0, _getIterator3.default)((0, _entries2.default)(filesDataCache)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = (0, _slicedToArray3.default)(_step.value, 2),
            key = _step$value[0],
            val = _step$value[1];
        if (!filesData[key]) {
          delete filesDataCache[key];
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    var isChanged = (0, _entries2.default)(filesData).some(function (_ref) {
      var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
          val = _ref2[0],
          key = _ref2[1];
      return filesDataCache[key] !== val;
    });
    if (!isChanged) {
      callback();
      return;
    }
    _spritesmith2.default.run((0, _assign2.default)({ src: srcImageFilenames }, spritesmithOpts), function (err, result) {
      if (err) throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
      var fileRootPath = (0, _path.relative)(imgSrcBase, dirGroup + '.png');
      var imageFile = new _gulpUtil.File();
      imageFile.path = fileRootPath;
      imageFile.contents = new Buffer(result.image, 'binary');
      _this.push(imageFile);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;
      try {
        for (var _iterator2 = (0, _getIterator3.default)((0, _entries2.default)(result.coordinates)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = (0, _slicedToArray3.default)(_step2.value, 2),
              filePath = _step2$value[0],
              obj = _step2$value[1];
          var mapKey = (0, _path.relative)(imgSrcBase, filePath);
          spriteHash[mapKey] = (0, _assign2.default)({ url: '/' + fileRootPath }, obj);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
      callback();
    });
  };
  var flush = function flush(callback) {
    this.push(new _gulpUtil.File({
      path: stylusFileName + '.styl',
      contents: new Buffer(createCss((0, _stringify2.default)(spriteHash)))
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
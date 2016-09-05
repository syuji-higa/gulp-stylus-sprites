var EXTNAMES, File, PLUGIN_NAME, PluginError, defOpts, defaults, dirname, extname, filesDataCache, filter, forEach, join, map, merge, readFileSync, readdirSync, ref, ref1, ref2, ref3, relative, some, spritesmith, through,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
through = require('through2');
ref = require('gulp-util'), File = ref.File, PluginError = ref.PluginError;
ref1 = require('path'), join = ref1.join, dirname = ref1.dirname, relative = ref1.relative, extname = ref1.extname;
ref2 = require('lodash'), forEach = ref2.forEach, map = ref2.map, filter = ref2.filter, defaults = ref2.defaults, some = ref2.some, merge = ref2.merge;
ref3 = require('fs'), readdirSync = ref3.readdirSync, readFileSync = ref3.readFileSync;
spritesmith = require('spritesmith');
PLUGIN_NAME = 'gulp-stylus-sprites';
EXTNAMES = ['.png', '.jpg', '.jpeg', '.gif'];
defOpts = {
  imgSrcBase: 'sprite',
  stylusFileName: 'sprite',
  spritesmithOpts: {}
};
filesDataCache = {};
module.exports = function(opts) {
  var createCss, dirGroups, flush, imgSrcBase, mixin, ref4, spriteHash, spritesmithOpts, stylusFileName, transform;
  if (opts == null) {
    opts = {};
  }
  ref4 = defaults(opts, defOpts), imgSrcBase = ref4.imgSrcBase, stylusFileName = ref4.stylusFileName, spritesmithOpts = ref4.spritesmithOpts;
  dirGroups = [];
  spriteHash = {};
  transform = function(file, encode, callback) {
    var dirGroup, filesData, isChanged, srcImageFilenames;
    if (file.isNull()) {
      this.push(file);
      callback();
      return;
    }
    if (!file.isBuffer()) {
      return;
    }
    dirGroup = relative('', dirname(file.path));
    if (dirGroups.indexOf(dirGroup) !== -1) {
      callback();
      return;
    }
    dirGroups.push(dirGroup);
    srcImageFilenames = map(readdirSync(dirGroup), function(fileName) {
      return join(dirGroup, fileName);
    });
    srcImageFilenames = filter(srcImageFilenames, function(fileName) {
      var ref5;
      return ref5 = extname(fileName).toLowerCase(), indexOf.call(EXTNAMES, ref5) >= 0;
    });
    filesData = {};
    forEach(srcImageFilenames, function(fileName) {
      var fileData;
      fileData = readFileSync(fileName).toString();
      if (filesDataCache[fileName]) {
        return filesData[fileName] = fileData;
      } else {
        filesDataCache[fileName] = fileData;
        return filesData[fileName] = null;
      }
    });
    isChanged = some(filesData, function(val, key) {
      return filesDataCache[key] !== val;
    });
    if (!isChanged) {
      return;
    }
    return spritesmith(merge({
      src: srcImageFilenames
    }, spritesmithOpts), (function(_this) {
      return function(err, result) {
        var fileRootPath, imageFile;
        if (err != null) {
          throw new PluginError(PLUGIN_NAME, err);
        }
        fileRootPath = relative(imgSrcBase, dirGroup + ".png");
        imageFile = new File;
        imageFile.path = fileRootPath;
        imageFile.contents = new Buffer(result.image, 'binary');
        _this.push(imageFile);
        forEach(result.coordinates, function(obj, filePath) {
          var mapKey;
          mapKey = relative(imgSrcBase, filePath);
          return spriteHash[mapKey] = merge(obj, {
            url: "/" + fileRootPath
          });
        });
        return callback();
      };
    })(this));
  };
  flush = function(callback) {
    this.push(new File({
      path: stylusFileName + ".styl",
      contents: new Buffer(createCss(JSON.stringify(spriteHash)))
    }));
    this.emit('end');
    return callback();
  };
  createCss = function(cssHash) {
    if (cssHash) {
      return "sprite-hash = " + cssHash + "\n" + (mixin());
    } else {
      return '';
    }
  };
  mixin = function() {
    return "sprite(filepath, scale = 1)\n  image-hash = sprite-hash[filepath]\n  if !image-hash\n    error('Not found image file ' + filepath + '.')\n  width: (image-hash.width * scale)px\n  height: (image-hash.height * scale)px\n  url = image-hash.url\n  background: url(url) no-repeat\n  background-position: (-1 * image-hash.x * scale)px (-1 * image-hash.y * scale)px\n  if scale != 1\n    background-size: (image-hash.width * scale)px, (image-hash.height * scale)px\nsprite-retina(filepath)\n  sprite filepath, 0.5";
  };
  return through.obj({
    objectMode: true
  }, transform, flush);
};

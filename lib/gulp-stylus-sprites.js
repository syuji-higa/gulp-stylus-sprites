var File, assign, basename, defOpts, defaults, defaultsDeep, dirname, filesDataCache, join, recursive, ref, ref1, some, spritesmith, through;
through = require('through2');
File = require('gulp-util').File;
ref = require('path'), join = ref.join, dirname = ref.dirname, basename = ref.basename;
ref1 = require('lodash'), defaults = ref1.defaults, defaultsDeep = ref1.defaultsDeep, assign = ref1.assign, some = ref1.some;
recursive = require('recursive-readdir');
spritesmith = require('spritesmith');
defOpts = {
  imgSrcBase: '/sprite',
  stylusFileName: 'sprite',
  spritesmithOpts: {}
};
filesDataCache = {};
module.exports = function(opts) {
  var createCss, cssHash, files, filesData, flush, folderInFileCount, imgSrcBase, mixin, ref2, spritePath, spritesmithOpts, stylusFileName, transform;
  if (opts == null) {
    opts = {};
  }
  ref2 = defaults(opts, defOpts), imgSrcBase = ref2.imgSrcBase, stylusFileName = ref2.stylusFileName, spritesmithOpts = ref2.spritesmithOpts;
  spritePath = '';
  folderInFileCount = 0;
  files = [];
  cssHash = {};
  filesData = {};
  transform = function(file, encode, callback) {
    var baseSplitFilePaths, fileData, filePath;
    if (!file.path.match(/\\/)) {
      filePath = file.path;
    } else {
      filePath = file.path.replace(/\\/g, '/');
    }
    baseSplitFilePaths = filePath.split(imgSrcBase);
    fileData = file;
    file = {
      fullPath: filePath,
      toRootDir: baseSplitFilePaths[0],
      fromRootDir: dirname(baseSplitFilePaths[1].replace('/', '')),
      name: basename(baseSplitFilePaths[1])
    };
    files.push(file.fullPath);
    if (spritePath !== file.fromRootDir) {
      spritePath = file.fromRootDir;
      filesData[spritePath] = {};
      if (!filesDataCache[spritePath]) {
        filesDataCache[spritePath] = {};
      }
    }
    filesData[spritePath][file.fullPath] = fileData;
    return recursive(join(file.toRootDir, imgSrcBase, spritePath), (function(_this) {
      return function(err, _files) {
        var isChanged;
        if (_files.length - 1 > folderInFileCount) {
          folderInFileCount++;
          callback();
          return;
        }
        isChanged = some(filesData[spritePath], function(val, key) {
          var ref3;
          return val.contents.toString() !== ((ref3 = filesDataCache[spritePath][key]) != null ? ref3.contents.toString() : void 0);
        });
        spritesmithOpts.src = files;
        return spritesmith(spritesmithOpts, function(err, result) {
          var imageFile, key, keyName, obj, ref3, val;
          if (err) {
            console.log(err);
          }
          if (isChanged) {
            imageFile = new File;
            imageFile.path = spritePath + ".png";
            imageFile.contents = new Buffer(result.image, 'binary');
            _this.push(imageFile);
          }
          obj = {};
          ref3 = result.coordinates;
          for (key in ref3) {
            val = ref3[key];
            keyName = key.split(imgSrcBase)[1];
            obj[keyName] = val;
            obj[keyName].url = "/" + spritePath + ".png";
            obj[keyName].width = val.width;
            obj[keyName].height = val.height;
          }
          for (key in obj) {
            val = obj[key];
            cssHash[key] = val;
          }
          filesDataCache[spritePath] = assign(filesData[spritePath]);
          folderInFileCount = 0;
          files = [];
          return callback();
        });
      };
    })(this));
  };
  flush = function(callback) {
    this.push(new File({
      path: stylusFileName + ".styl",
      contents: new Buffer(createCss(JSON.stringify(cssHash)))
    }));
    this.emit('end');
    return callback();
  };
  createCss = function(cssHash) {
    var cssData;
    return cssData = cssHash ? "sprite-hash = " + cssHash + "\n" + (mixin()) : '';
  };
  mixin = function() {
    return "sprite(filepath, scale = 1)\n  image-hash = sprite-hash[filepath]\n  width: (image-hash.width * scale)px\n  height: (image-hash.height * scale)px\n  url = image-hash.url\n  background: url(url) no-repeat\n  background-position: (-1 * image-hash.x * scale)px (-1 * image-hash.y * scale)px\n  if scale != 1\n    background-size: (image-hash.imageWidth * scale)px, (image-hash.imageHeight * scale)px\nsprite-retina(filepath)\n  sprite filepath, 0.5";
  };
  return through.obj(transform, flush);
};

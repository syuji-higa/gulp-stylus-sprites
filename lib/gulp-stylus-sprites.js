var File, assign, basename, clone, defOpts, dirname, join, recursive, ref, ref1, spritesmith, through;
through = require('through2');
File = require('gulp-util').File;
ref = require('path'), join = ref.join, dirname = ref.dirname, basename = ref.basename;
ref1 = require('lodash'), assign = ref1.assign, clone = ref1.clone;
recursive = require('recursive-readdir');
spritesmith = require('spritesmith');
defOpts = {
  imgSrcBase: '/sprite',
  stylusFileName: 'sprite'
};
module.exports = function(opts) {
  var createCss, cssHash, files, flush, folderInFileCount, imgSrcBase, mixin, ref2, spritePath, stylusFileName, transform;
  ref2 = assign(clone(defOpts), opts), imgSrcBase = ref2.imgSrcBase, stylusFileName = ref2.stylusFileName;
  spritePath = '';
  folderInFileCount = 0;
  files = [];
  cssHash = {};
  transform = function(file, encode, callback) {
    var baseSplitFilePaths, filePath;
    if (!file.path.match(/\\/)) {
      filePath = file.path;
    } else {
      filePath = file.path.replace(/\\/g, '/');
    }
    baseSplitFilePaths = filePath.split(imgSrcBase);
    file = {
      fullPath: filePath,
      toRootDir: baseSplitFilePaths[0],
      fromRootDir: dirname(baseSplitFilePaths[1].replace('/', '')),
      name: basename(baseSplitFilePaths[1])
    };
    files.push(file.fullPath);
    if (spritePath !== file.fromRootDir) {
      spritePath = file.fromRootDir;
    }
    return recursive(join(file.toRootDir, imgSrcBase, spritePath), (function(_this) {
      return function(err, _files) {
        if (_files.length - 1 > folderInFileCount) {
          folderInFileCount++;
          callback();
          return;
        }
        return spritesmith({
          src: files
        }, function(err, result) {
          var imageFile, key, keyName, obj, ref3, val;
          if (err) {
            console.log(err);
          }
          imageFile = new File;
          imageFile.path = spritePath + ".png";
          imageFile.contents = new Buffer(result.image, 'binary');
          _this.push(imageFile);
          obj = {};
          ref3 = result.coordinates;
          for (key in ref3) {
            val = ref3[key];
            keyName = key.split(imgSrcBase)[1];
            obj[keyName] = val;
            obj[keyName].url = spritePath + ".png";
            obj[keyName].width = val.width;
            obj[keyName].height = val.height;
          }
          for (key in obj) {
            val = obj[key];
            cssHash[key] = val;
          }
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

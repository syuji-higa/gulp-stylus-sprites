var File, assign, clone, defOpts, join, recursive, ref, spritesmith, through;
through = require('through2');
File = require('gulp-util').File;
join = require('path').join;
ref = require('lodash'), assign = ref.assign, clone = ref.clone;
recursive = require('recursive-readdir');
spritesmith = require('spritesmith');
defOpts = {
  imgSrcBase: '/fixtures/sprite',
  stylusFileName: 'sprite'
};
module.exports = function(opts) {
  var createCss, cssHash, files, flush, folderInFileCount, imgSrcBase, mixin, ref1, spritePath, stylusFileName, transform;
  ref1 = assign(clone(defOpts), opts), imgSrcBase = ref1.imgSrcBase, stylusFileName = ref1.stylusFileName;
  spritePath = '';
  folderInFileCount = 0;
  files = [];
  cssHash = {};
  transform = function(file, encode, callback) {
    var baseSplitFilePaths, filePath, filePaths;
    if (!file.path.match(/\\/)) {
      filePath = file.path;
    } else {
      filePath = file.path.replace(/\\/g, '/');
    }
    baseSplitFilePaths = filePath.split(imgSrcBase);
    filePaths = baseSplitFilePaths[1].match(/^(\/.+)(\/)(.+?\..+?)$/);
    file = {
      fullPath: filePath,
      toRootDir: baseSplitFilePaths[0],
      fromRootDir: filePaths[1],
      name: filePaths[3]
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
          var imageFile, key, keyName, obj, ref2, val;
          if (err) {
            console.log(err);
          }
          imageFile = new File;
          imageFile.path = spritePath + ".png";
          imageFile.contents = new Buffer(result.image, 'binary');
          _this.push(imageFile);
          obj = {};
          ref2 = result.coordinates;
          for (key in ref2) {
            val = ref2[key];
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

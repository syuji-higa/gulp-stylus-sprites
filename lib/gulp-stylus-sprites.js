var File, recursive, spritesmith, through;
through = require('through2');
File = require('gulp-util').File;
recursive = require('recursive-readdir');
spritesmith = require('spritesmith');
module.exports = function(option) {
  var createCss, cssHash, files, flush, folderInFileCount, mixin, spritePath, transform;
  spritePath = '';
  folderInFileCount = 0;
  files = [];
  cssHash = '';
  transform = function(file, encode, callback) {
    var filePath, _file;
    if (!file.path.match(/\\/)) {
      _file = file.path;
    } else {
      _file = file.path.replace(/\\/g, '/');
      option.imagesSrcBase = option.imagesSrcBase.replace(/\\/g, '/');
    }
    filePath = _file.replace(option.imagesSrcBase, '').match(/^(\/)(.+)(\/.+?\..+?)$/);
    console.log(_file);
    console.log(option.imagesSrcBase);
    file = {
      root: _file,
      path: filePath[0],
      dir: filePath[2],
      name: filePath[3].replace('/', '')
    };
    files.push(file.root);
    if (spritePath !== file.dir) {
      spritePath = file.dir;
    }
    return recursive("" + option.imagesSrcBase + "/" + spritePath, (function(_this) {
      return function(err, _files) {
        if (_files.length - 1 !== folderInFileCount) {
          folderInFileCount++;
          callback();
          return;
        }
        return spritesmith({
          src: files
        }, function(err, result) {
          var imageFile, key, keyName, obj, value, _ref;
          if (err) {
            console.log(err);
          }
          imageFile = new File;
          imageFile.path = "" + spritePath + ".png";
          imageFile.contents = new Buffer(result.image, 'binary');
          _this.push(imageFile);
          obj = {};
          _ref = result.coordinates;
          for (key in _ref) {
            value = _ref[key];
            keyName = key.replace(option.imagesSrcBase, '');
            obj[keyName] = value;
            obj[keyName].url = "" + spritePath + ".png";
            obj[keyName].width = result.properties.width;
            obj[keyName].height = result.properties.height;
          }
          cssHash += JSON.stringify(obj);
          folderInFileCount = 0;
          files = [];
          return callback();
        });
      };
    })(this));
  };
  flush = function(callback) {
    if (!option.spriteStylusName) {
      option.spriteStylusName = 'sprite';
    }
    this.push(new File({
      path: "" + option.spriteStylusName + ".styl",
      contents: new Buffer(createCss(cssHash))
    }));
    this.emit('end');
    return callback();
  };
  createCss = function(cssHash) {
    var cssData;
    return cssData = cssHash ? "sprite-hash = " + cssHash + "\n" + (mixin()) : '';
  };
  mixin = function() {
    return "sprite(filepath, scale = 1)\n  image-hash = sprite-hash[filepath]\n  width: (image-hash.width * scale)px\n  height: (image-hash.height * scale)px\n  url = image-hash.url\n  background: url(url) no-repeat\n  background-position: (image-hash.x * scale)px (image-hash.y * scale)px\n  if scale != 1\n    background-size: (image-hash.imageWidth * scale)px, (image-hash.imageHeight * scale)px\nsprite-retina(filepath)\n  sprite filepath, 0.5";
  };
  return through.obj(transform, flush);
};

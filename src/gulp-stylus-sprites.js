import through from 'through2';
import { File, PluginError } from 'gulp-util';
import { join, dirname, relative, extname } from 'path';
import { forEach, map, filter, defaults, some, merge } from 'lodash';
import { readdirSync, readFileSync } from 'fs';
import Spritesmith from 'spritesmith';

const PLUGIN_NAME = 'gulp-stylus-sprites';
const EXTNAMES = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
];

const defOpts = {
  imgSrcBase     : 'sprite',
  stylusFileName : 'sprite',
  spritesmithOpts: {},
};

const filesDataCache = {};

module.exports = (opts = {}) => {

  const { imgSrcBase, stylusFileName, spritesmithOpts } = defaults(opts, defOpts);

  const dirGroups  = [];
  const spriteHash = {};

  const transform = function(file, encode, callback) {

    if(file.isNull()) {
      this.push(file);
      callback();
      return;
    }

    if(!file.isBuffer()) return;

    const dirGroup = relative('', dirname(file.path));
    if(dirGroups.indexOf(dirGroup) !== -1) {
      callback();
      return;
    }
    dirGroups.push(dirGroup);

    let srcImageFilenames = map(readdirSync(dirGroup), (fileName) => {
      return join(dirGroup, fileName);
    });

    srcImageFilenames = filter(srcImageFilenames, (fileName) => {
      return EXTNAMES.some((name) => extname(fileName).toLowerCase() === name);
    });

    const filesData = {};
    forEach(srcImageFilenames, (fileName) => {
      const fileData = readFileSync(fileName).toString();
      if(filesDataCache[fileName]) {
        filesData[fileName] = fileData;
      } else {
        filesDataCache[fileName] = fileData;
        filesData[fileName] = null;
      }
    });

    const isChanged = some(filesData, (val, key) => {
      return filesDataCache[key] !== val;
    });

    if(!isChanged) return;

    Spritesmith.run(merge({ src: srcImageFilenames }, spritesmithOpts), (err, result) => {

      if(err) throw new PluginError(PLUGIN_NAME, err);

      const fileRootPath = relative(imgSrcBase, `${ dirGroup }.png`);

      const imageFile = new File();
      imageFile.path = fileRootPath;
      imageFile.contents = new Buffer(result.image, 'binary');
      this.push(imageFile);

      forEach(result.coordinates, (obj, filePath) => {
        const mapKey = relative(imgSrcBase, filePath);
        spriteHash[mapKey] = merge(obj, {
          url: `/${ fileRootPath }`,
        });
      });

      callback()
    });
  };

  const flush = function(callback) {
    this.push(new File({
      path: `${ stylusFileName }.styl`,
      contents: new Buffer(createCss(JSON.stringify(spriteHash))),
    }));
    this.emit('end');
    callback();
  };

  const createCss = function(cssHash) {
    if(cssHash) {
      return `sprite-hash = ${ cssHash }
${ mixin() }`;
    } else {
       return '';
    }
  };

  const mixin = function() {
    return `sprite(filepath, scale = 1)
  image-hash = sprite-hash[filepath]
  if !image-hash
    error('Not found image file ' + filepath + '.')
  width: (image-hash.width * scale)px
  height: (image-hash.height * scale)px
  url = image-hash.url
  background: url(url) no-repeat
  background-position: (-1 * image-hash.x * scale)px (-1 * image-hash.y * scale)px
  if scale != 1
    background-size: (image-hash.width * scale)px, (image-hash.height * scale)px
sprite-retina(filepath)
  sprite filepath, 0.5`;
  };

  return through.obj({ objectMode: true }, transform, flush);

}

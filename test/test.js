import stylusSprites from '../lib/gulp-stylus-sprites';
import { File } from 'gulp-util';
import { PassThrough } from 'stream';
import { join, extname, resolve } from 'path';
import fs from 'fs';

const createFile = (path) => {
  const _path = join(__dirname, './fixtures', path);
  return new File({
    path: _path,
    contents: fs.readFileSync(_path),
  });
};

describe('gulp-stylus-sprite', () => {

  it('create sprite circl', (done) => {
    let _isGetAllData = false;
    const _stream = stylusSprites({
      imgSrcBase: resolve(__dirname, 'fixtures/sprite'),
      spritesmithOpts: {
        engine: 'pngsmith',
      },
    });
    _stream.on('data', (file) => {
      switch(extname(file.path)) {
        case '.png':
          console.log(file);
          fs.writeFile(`${ __dirname }/fixtures/htdocs/${ file.path }`, file.contents, 'binary', (err) => {
            if(err) console.log(err);
          });
          break;
        case '.styl':
          console.log(file.contents.toString());
          fs.writeFile(`${ __dirname }/fixtures/stylus/${ file.path }`, file.contents, 'binary', (err) => {
            if(err) console.log(err);
          });
          break;
      }
    });
    _stream.on('end', () => {
      if(_isGetAllData) {
        done();
      } else {
        _isGetAllData = true;
      }
    });
    _stream.write(createFile('sprite/images/circle/blue.png'));
    _stream.write(createFile('sprite/images/circle/green.png'));
    _stream.write(createFile('sprite/images/circle/red.png'));
    _stream.end();
  });

  it('create sprite square', (done) => {
    let _isGetAllData = false;
    const _stream = stylusSprites({
      imgSrcBase: resolve(__dirname, 'fixtures/sprite'),
      stylusFileName: 'test',
      spritesmithOpts: {
        engine: 'pngsmith',
      },
    });
    _stream.on('data', (file) => {
      switch(extname(file.path)) {
        case '.png':
          console.log(file);
          fs.writeFile(`${ __dirname }/fixtures/htdocs/${ file.path }`, file.contents, 'binary', (err) => {
            if(err) console.log(err);
          });
          break;
        case '.styl':
          console.log(file.contents.toString())
          fs.writeFile(`${ __dirname }/fixtures/stylus/${ file.path }`, file.contents, 'binary', (err) => {
            if(err) console.log(err);
          });
          break;
      }
    });
    _stream.on('end', () => {
      if(_isGetAllData) {
        done();
      } else {
        _isGetAllData = true;
      }
    });
    _stream.write(createFile('sprite/images/square/blue.png'));
    _stream.write(createFile('sprite/images/square/green.png'));
    _stream.write(createFile('sprite/images/square/red.png'));
    _stream.end();
  });

});

gulp-stylus-sprites
===============

```
import gulp from 'gulp';
import filter from 'gulp-filter';
import stylusSprites from 'gulp-stylus-sprites';

gulp.task('sprite', () => {
  const _imageDest  = 'htdocs';
  const _pngFilter  = filter(['**/*.png'], { restore: true });
  const _stylFilter = filter(['**/*.styl'], { restore: true });

  gulp.src('./sprite/**/*.png')
    .pipe(stylusSprites, {
      imagesSrcBase: `${ __dirname }/sprite`,
    })
    .pipe(_pngFilter)
    .pipe(gulp.dest(_imageDest))
    .pipe(_pngFilter.restore)
    .pipe(_stylFilter)
    .pipe(cache('stylus'))
    .pipe(gulp.dest(SPRITE_CSS_DEST))
    .pipe(_stylFilter.restore);
});
```

gulp-stylus-sprites
===============

```
gulp = require 'gulp'
gulpif = require 'gulp-if'
stylusSprites = require 'gulp-stylus-sprites'

gulp.task 'sprite', ->
  gulp
    .src './sprite/**/*.png'
    .pipe plumber()
    .pipe stylusSprites
      imagesSrcBase: "#{__dirname}/sprite"
    .pipe gulpif '*.styl', gulp.dest('./stylus'), gulp.dest('./htdocs')
```

import gulp from 'gulp';
import babel from 'gulp-babel';
import replace from 'gulp-replace';
import mocha from 'gulp-mocha';

const files = {
  src : 'src/**/*.js',
  test: 'test/**/*.js',
};

gulp.task('watch', () => {
  return gulp.watch(files.src, ['babel']);
});

gulp.task('babel', () => {
  return gulp.src(files.src)
    .pipe(babel({
      plugins: ['transform-runtime'],
    }))
    .pipe(replace(/\n{2,}/g, '\n'))
    .pipe(gulp.dest('lib'))
    .on('end', () => {
      gulp.start('mocha');
    });
});

gulp.task('mocha', () => {
  return gulp.src(files.test, { read: false })
    .pipe(babel())
    .pipe(mocha({ reporter: 'tap' }))
});

gulp.task('default', [
  'watch',
  'babel',
]);

var gulp = require('gulp');
var stylus = require('gulp-stylus');

gulp.task('css', function() {
    return gulp.src('client/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('./client/'));
});

gulp.task('default', ['css']);

gulp.task('watch', ['default'], function() {
    gulp.watch('client/*.styl', ['css']);
});

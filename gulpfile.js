var gulp = require('gulp');
var stylus = require('gulp-stylus');

gulp.task('css', function() {
    return gulp.src('client/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('./client/'));
});

gulp.task('ui', function() {
    gulp.src('./client/js/ui-chat.js')
    .pipe(browserify({
        //options go here
    }))
    .pipe(gulp.dest('./client/js/build'))
});

gulp.task('default', ['css', 'ui']);

gulp.task('watch', ['default'], function() {
    gulp.watch('client/*.styl', ['css']);
});

var browserify = require('gulp-browserify');


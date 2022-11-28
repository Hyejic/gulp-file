const { src, dest, watch, parallel, series, task, lastRun } = require('gulp')

const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps')
const bs = require('browser-sync')
const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const del = require('del')
// const uglify = require('gulp-uglify') //min파일 만들기

// root
const root   = './src'
const dist   = './dist'
const path = {
    src: {
      html: root + '/*.html',
      js: root + '/js/*.js',
      scss: root + '/css/*.scss',
      font: root + '/fonts/*',
      image: root + '/images/*'
    },
    target: {
      html: root + '/*.html',
      js: root + '/js/*.js',
      scss: root + '/css/*.scss',
      font: root + '/fonts/*.+(eot|otf|woff|woff2|ttf)',
      image: root + '/images/*.+(gif|jpg|svg|png|mp4|webm)'
    }
}


//src-----------------------------------------------------------------
// sass task
const sassTask = function(done) {

  console.log('sass task');

  src([path.src.scss], { since: lastRun(sassTask) })
    // .pipe(cached('scss'))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./src/css'))
    .pipe(bs.stream())

  done()

}

// image task
const imgTask = function(done) {

  console.log('img task');

  src([path.src.image], { since: lastRun(imgTask) })
    // .pipe(cached('img'))
    .pipe(bs.stream())
    // .on('end', done)

  done()


}

// js task
const jsTask = function(done) {

  console.log('js task')

  done()

}

//---------------------------------------------------------------------

// html task (build)
const buildHtmlTask = function(done) {

  console.log('build html task')
  src([path.target.html])
    .pipe(dest(dist))
    .on('end', done)

}

// sass task (build)
const buildSassTask = function(done) {

  console.log('build sass task');

  src([path.target.scss])
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 2 versions'))
    // .pipe(sourcemaps.write('.'))
    .pipe(dest(dist + '/css'))
    .on('end', done)

}

// js task (build)
const buildJsTask = function(done) {

  console.log('build js task');

  src([path.target.js])
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(dest(dist + '/js'))
    .on('end', done)

    //plugins min
    // src([
    //   root + '/js/plugins/lodash.js',
    //   root + '/js/plugins/gsap.min.js',
    //   root + '/js/plugins/scrollTrigger.js',
    //   root + '/js/plugins/scrollToPlugin.min.js'
    // ])
    // .pipe(uglify())
    // .pipe(concat('plugins.min.js'))
    // .pipe(dest(dist + '/js', { sourcemaps: true }))
    // .on('end', done)
}

// image task (build)
const buildImgTask = function(done) {

  console.log('build img task')

  src([path.target.image])
    .pipe(dest(dist + '/images/'))
    .on('end', done)
  // done()

}

// resource task (build)
const buildResourceTask = function(done) {

  console.log('resource task')

  src([path.target.font], { since: lastRun(buildResourceTask) })
    .pipe(dest(dist + '/fonts'))
    .on('end', done)

  // done()

}

// OS check
var newLine = process.platform === 'darwin' ? '\n' : '\r\n'

// reload
const reload = function(done){

	console.log(`${newLine}😊😊😊 ···· Reload${newLine}`)

  bs.reload()
	done()

};

// clear dist
const clear = function(done) {

  console.log('clear dist')

  del.sync(dist)

  done()

}

// watch task
const watchTask = function(done) {

  console.log('watch start')

  // del.sync(dist)

  bs.init({
    open: false,
    port: 8080,
    server: {
      routes: {
        '/': dist
      }
    }
  })


  watch([path.src.scss], series(sassTask, buildSassTask, reload))
  watch([path.src.html], series(buildHtmlTask, reload))
  watch([path.src.image], series(imgTask, buildImgTask, reload))
  watch([path.src.js], series(jsTask, buildJsTask, reload))
  watch([path.src.font], series(buildResourceTask, reload))
  const restart = require('gulp-restart')
  watch(['gulpfile.js'], series(restart, reload))

  // done()
}
exports.dev = series(watchTask)
// build
exports.build = series(clear, buildHtmlTask, buildSassTask, buildJsTask, buildImgTask, buildResourceTask)

// default
task('default', function(cb){
	series(clear, buildHtmlTask, buildSassTask, buildJsTask, buildImgTask, buildResourceTask, watchTask)()
	cb()
})

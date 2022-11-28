const { src, dest, watch, parallel, series, task, lastRun } = require('gulp')

const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps')
const bs = require('browser-sync')
const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const del = require('del')
const data = require('gulp-data')
const fileInclude = require('gulp-file-include')
const htmlbeautify = require('gulp-html-beautify');



// root
const root   = './src'
const dist   = './dist'
const path = {
    src: {
      // html: root + '/pages/*',
      html: root + '/pages/*.html',
      js: root + '/js/*.js',
      json: root + '/json/*.json',
      scss: root + '/css/*.scss',
      font: root + '/fonts/*',
      image: root + '/images/*',
      data: root + '/data.json',
    },
    target: {
      html: root + '/*.html',
      js: root + '/js/*.js',
      json: root + '/json/*.json',
      scss: root + '/css/*.scss',
      font: root + '/fonts/*.+(eot|otf|woff|woff2|ttf)',
      image: root + '/images/*.+(gif|jpg|svg|png|mp4|webm)'
    }
}


//src-----------------------------------------------------------------

const includeTask = done => {
  console.log('include Task', done)
  done()
}


// sass task
const sassTask = done => {

  console.log('sass task');

  src([path.src.scss], { since: lastRun(sassTask) })
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./src/css'))
    .pipe(bs.stream())

  done()

}

// image task
const imgTask = done => {

  console.log('img task');

  src([path.src.image], { since: lastRun(imgTask) })
    .pipe(bs.stream())

  done()


}

// js task
const jsTask = done => {

  console.log('js task')

  done()

}

const jsonTask = done => {

  console.log('json task')

  done()

}

//---------------------------------------------------------------------
// prettier
const buildPrettier = done => {

  src('dist/*.html')
    .pipe(htmlbeautify({
      "indent_size": 2,
      "indent_char": " ",
      "eol": "\n",
      "preserve_newlines": false,
    }))
    .pipe(dest(`${dist}/prettier`))
    .pipe(bs.stream())
  done()
}

// html task (build)
const buildHtmlTask = done => {

  console.log('build html task')

  src([path.src.html, '!' + './src/includes/*'])
  .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file'
    })
    .on('error', err => {
      console.error('include error 입니다' , err)
    }))
  .pipe(dest(`${dist}`))
    .pipe(bs.stream())
  done()

}


// sass task (build)
const buildSassTask = done => {

  console.log('build sass task');

  src([path.target.scss])
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(dist + '/css'))
    .on('end', done)

}

// js task (build)
const buildJsTask = done => {

  console.log('build js task');

  src([path.target.js])
    .pipe(babel())
    .pipe(dest(dist + '/js'))
    .on('end', done)
}

const buildJsonTask = done => {

  console.log('build json task');

  src([path.target.json])
    .pipe(dest(dist + '/json'))
    .on('end', done)
}

// image task (build)
const buildImgTask = done => {

  console.log('build img task')

  src([path.target.image])
    .pipe(dest(dist + '/images/'))
    .on('end', done)
  // done()

}

// resource task (build)
const buildResourceTask = done => {

  console.log('resource task')

  src([path.target.font], { since: lastRun(buildResourceTask) })
    .pipe(dest(dist + '/fonts'))
    .on('end', done)

  // done()

}

// OS check
var newLine = process.platform === 'darwin' ? '\n' : '\r\n'

// reload
const reload = done => {

	console.log(`${newLine}😊😊😊 ···· Reload${newLine}`)

  bs.reload()
	done()

};

// clear dist
const clear = done => {

  console.log('clear dist')

  del.sync(dist)

  done()

}

// watch task
const watchTask = done => {

  console.log('watch start')

  // del.sync(dist)

  bs.init({
    open: false,
    port: 8081,
    server: {
      routes: {
        '/': dist
      }
    }
  })

  watch([path.src.scss], series(sassTask, buildSassTask, reload))
  watch([path.src.html, './src/pages/includes/**/*.html', './src/pages/*.json' , './src/pages/includes/*'], series(includeTask, buildHtmlTask, reload))
  watch([path.src.image], series(imgTask, buildImgTask, reload))
  watch([path.src.js], series(jsTask, buildJsTask, reload))
  watch([path.src.json], series(jsonTask, buildJsonTask, reload))
  watch([path.src.font], series(buildResourceTask, reload))
  const restart = require('gulp-restart')
  watch(['gulpfile.js'], series(restart, reload))

  // done()
}
exports.dev = series(watchTask)
// build
exports.build = series(clear,buildPrettier, buildHtmlTask, buildSassTask, buildJsTask, buildJsonTask, buildImgTask, buildResourceTask)

// default
task('default', function(cb){
	series(clear, buildHtmlTask, buildSassTask, buildJsTask, buildJsonTask, buildImgTask, buildResourceTask, watchTask)()
	cb()
})

task('lint', cb => {
  series(buildPrettier)()
  cb()
})

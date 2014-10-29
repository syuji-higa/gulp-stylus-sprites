through = require 'through2'
{ File } = require 'gulp-util'
recursive = require 'recursive-readdir'
spritesmith = require 'spritesmith'

module.exports = (option) ->

  spritePath = ''
  folderInFileCount = 0
  files = []
  cssHash = ''

  transform = (file, encode, callback) ->

    filePath = file.path.replace option.imagesSrcBase, ''
      .match /^(\/)(.+)(\/.+?\..+?)$/
    file =
      root: file.path
      path: filePath[0]
      dir : filePath[2]
      name: filePath[3].replace '/', ''

    files.push file.root

    if spritePath isnt file.dir
      spritePath = file.dir

    recursive "#{option.imagesSrcBase}/#{spritePath}", (err, _files) =>

      if _files.length - 1 isnt folderInFileCount
        folderInFileCount++
        callback()
        return

      spritesmith
        src: files
        , (err, result) =>
          if err then console.log err
          #console.log result.image
          #console.log result.coordinates
          #console.log result.properties

          imageFile = new File
          imageFile.path = "#{spritePath}.png"
          imageFile.contents = new Buffer result.image, 'binary'
          @push imageFile

          obj = {}
          for key, value of result.coordinates
            keyName = key.replace option.imagesSrcBase, ''
            obj[keyName] = value
            obj[keyName].url = spritePath
            obj[keyName].width = result.properties.width
            obj[keyName].height = result.properties.height
          cssHash += JSON.stringify obj

          folderInFileCount = 0
          files = []
          callback()

  flush = (callback) ->

    @push new File
      path: '_sprite.styl'
      contents: new Buffer createCss(cssHash)
    @emit 'end'
    callback()

  createCss = (cssHash) ->
    cssData =
      """
      sprite-hash = #{cssHash}
      #{mixin()}
      """

  mixin = ->
    """
    sprite(filepath, scale = 1)
      image-hash = sprite-hash[filepath]
      width: (image-hash.width * scale)px
      height: (image-hash.height * scale)px
      url = image-hash.url
      background: url(url) no-repeat
      background-position: (image-hash.x * scale)px (image-hash.y * scale)px
      if scale != 1
        background-size: (image-hash.imageWidth * scale)px, (image-hash.imageHeight * scale)px
    sprite-retina(filepath)
      sprite filepath, 0.5
    """

  return through.obj transform, flush

through = require 'through2'
{ File } = require 'gulp-util'
{ join, dirname, basename } = require 'path'
{ defaults, defaultsDeep, assign, some } = require 'lodash'
recursive = require 'recursive-readdir'
spritesmith = require 'spritesmith'

defOpts =
  imgSrcBase     : '/sprite'
  stylusFileName : 'sprite'
  spritesmithOpts: {}

filesDataCache = {}

module.exports = (opts = {}) ->

  { imgSrcBase, stylusFileName, spritesmithOpts } = defaults opts, defOpts

  spritePath        = ''
  folderInFileCount = 0
  files             = []
  cssHash           = {}
  filesData         = {}

  transform = (file, encode, callback) ->

    unless file.path.match /\\/
      filePath = file.path
    else
      filePath = file.path.replace /\\/g, '/'

    baseSplitFilePaths = filePath.split imgSrcBase

    fileData = file

    file =
      fullPath   : filePath
      toRootDir  : baseSplitFilePaths[0]
      fromRootDir: dirname baseSplitFilePaths[1].replace '/', ''
      name       : basename baseSplitFilePaths[1]

    files.push file.fullPath

    if spritePath isnt file.fromRootDir
      spritePath            = file.fromRootDir
      filesData[spritePath] = {}
      unless filesDataCache[spritePath]
        filesDataCache[spritePath] = {}

    filesData[spritePath][file.fullPath] = fileData

    recursive join(file.toRootDir, imgSrcBase, spritePath), (err, _files) =>

      if _files.length - 1 > folderInFileCount
        folderInFileCount++
        callback()
        return

      isChanged = some filesData[spritePath], (val, key) ->
        val.contents.toString() isnt filesDataCache[spritePath][key]?.contents.toString()

      spritesmithOpts.src = files

      spritesmith spritesmithOpts, (err, result) =>
        if err then console.log err
        #console.log result.image
        #console.log result.coordinates
        #console.log result.properties

        if isChanged
          imageFile = new File
          imageFile.path = "#{spritePath}.png"
          imageFile.contents = new Buffer result.image, 'binary'
          @push imageFile

        obj = {}
        for key, val of result.coordinates
          keyName = key.split(imgSrcBase)[1]
          obj[keyName] = val
          obj[keyName].url = "/#{spritePath}.png"
          obj[keyName].width = val.width
          obj[keyName].height = val.height

        for key, val of obj
          cssHash[key] = val

        filesDataCache[spritePath] = assign filesData[spritePath]

        folderInFileCount = 0
        files = []
        callback()

  flush = (callback) ->

    @push new File
      path: "#{stylusFileName}.styl"
      contents: new Buffer createCss(JSON.stringify(cssHash))
    @emit 'end'
    callback()

  createCss = (cssHash) ->
    cssData =
      if cssHash
        """
        sprite-hash = #{cssHash}
        #{mixin()}
        """
      else
        ''

  mixin = ->
    """
    sprite(filepath, scale = 1)
      image-hash = sprite-hash[filepath]
      width: (image-hash.width * scale)px
      height: (image-hash.height * scale)px
      url = image-hash.url
      background: url(url) no-repeat
      background-position: (-1 * image-hash.x * scale)px (-1 * image-hash.y * scale)px
      if scale != 1
        background-size: (image-hash.imageWidth * scale)px, (image-hash.imageHeight * scale)px
    sprite-retina(filepath)
      sprite filepath, 0.5
    """

  return through.obj transform, flush

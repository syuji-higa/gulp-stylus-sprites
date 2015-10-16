through = require 'through2'
{ File, PluginError } = require 'gulp-util'
{ join, dirname, relative, extname } = require 'path'
{ forEach, map, filter, defaults, some, merge } = require 'lodash'
{ readdirSync, readFileSync } = require 'fs'
spritesmith = require 'spritesmith'

PLUGIN_NAME = 'gulp-stylus-sprites'
EXTNAMES = [
  '.png'
  '.jpg'
  '.jpeg'
  '.gif'
]

defOpts =
  imgSrcBase     : 'sprite'
  stylusFileName : 'sprite'
  spritesmithOpts: {}

filesDataCache = {}

module.exports = (opts = {}) ->

  { imgSrcBase, stylusFileName, spritesmithOpts } = defaults opts, defOpts

  dirGroups  = []
  spriteHash = {}

  transform = (file, encode, callback) ->

    if file.isNull()
      @push file
      callback()
      return

    return unless file.isBuffer()

    dirGroup = relative '', dirname file.path
    if dirGroups.indexOf(dirGroup) isnt -1
      callback()
      return
    dirGroups.push dirGroup

    srcImageFilenames = map readdirSync(dirGroup), (fileName) ->
      join dirGroup, fileName

    srcImageFilenames = filter srcImageFilenames, (fileName) ->
      extname(fileName).toLowerCase() in EXTNAMES

    filesData = {}
    forEach srcImageFilenames, (fileName) ->
      fileData = readFileSync(fileName).toString()
      if filesDataCache[fileName]
        filesData[fileName] = fileData
      else
        filesDataCache[fileName] = fileData
        filesData[fileName] = null

    isChanged = some filesData, (val, key) ->
      filesDataCache[key] isnt val

    return unless isChanged

    spritesmith merge({ src: srcImageFilenames }, spritesmithOpts), (err, result) =>

      throw new PluginError PLUGIN_NAME, err if err?

      fileRootPath = relative imgSrcBase, "#{dirGroup}.png"

      imageFile = new File
      imageFile.path = fileRootPath
      imageFile.contents = new Buffer result.image, 'binary'
      @push imageFile

      forEach result.coordinates, (obj, filePath) ->
        mapKey = relative imgSrcBase, filePath
        spriteHash[mapKey] = merge obj,
          url: "/#{fileRootPath}"

      callback()

  flush = (callback) ->
    @push new File
      path: "#{stylusFileName}.styl"
      contents: new Buffer createCss(JSON.stringify(spriteHash))
    @emit 'end'
    callback()

  createCss = (cssHash) ->
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
        background-size: (image-hash.width * scale)px, (image-hash.height * scale)px
    sprite-retina(filepath)
      sprite filepath, 0.5
    """

  return through.obj { objectMode: true }, transform, flush

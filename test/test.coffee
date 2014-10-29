stylusSprite = require '../lib/gulp-stylus-sprite'
{ File } = require 'gulp-util'
{ PassThrough } = require 'stream'
{ resolve, join, extname } = require 'path'
fs = require 'fs'

createFile = (path) ->
  path = join __dirname, './fixtures', path
  new File
    path: path
    contents: fs.readFileSync path

describe 'gulp-stylus-sprite', ->

  it "create sprite circle", (done) ->
    isGetAllData = false
    stream = stylusSprite
      imagesSrcBase: "#{__dirname}/fixtures/sprite"
    stream.on 'data', (file) ->
      switch extname file.path
        when '.png'
          console.log file
          #fs.writeFile __dirname + '/fixtures/htdocs/' + file.path, file.contents, 'binary', (err) ->
          #  if err then console.log err
        when '.styl'
          console.log file.contents.toString()
          #fs.writeFile __dirname + '/fixtures/stylus/' + file.path, file.contents, 'binary', (err) ->
          #  if err then console.log err
    stream.on 'end', ->
      if isGetAllData
        done()
      else
        isGetAllData = true
    stream.write createFile 'sprite/images/circle/blue.png'
    stream.write createFile 'sprite/images/circle/green.png'
    stream.write createFile 'sprite/images/circle/red.png'
    stream.end()

  it "create sprite square", (done) ->
    isGetAllData = false
    stream = stylusSprite
      imagesSrcBase: "#{__dirname}/fixtures/sprite"
    stream.on 'data', (file) ->
      switch extname file.path
        when '.png'
          console.log file
          #fs.writeFile __dirname + '/fixtures/htdocs/' + file.path, file.contents, 'binary', (err) ->
          #  if err then console.log err
        when '.styl'
          console.log file.contents.toString()
          #fs.writeFile __dirname + '/fixtures/stylus/' + file.path, file.contents, 'binary', (err) ->
          #  if err then console.log err
    stream.on 'end', ->
      if isGetAllData
        done()
      else
        isGetAllData = true
    stream.write createFile 'sprite/images/square/blue.png'
    stream.write createFile 'sprite/images/square/green.png'
    stream.write createFile 'sprite/images/square/red.png'
    stream.end()
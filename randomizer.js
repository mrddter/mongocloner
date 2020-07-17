const { nameByRace } = require('fantasy-name-generator')
const faker = require('faker') // const { Types } = require('mongoose')
const moment = require('moment')

module.exports = {
  getRandomInt,
  userInfoRandomizer,
}

function userInfoRandomizer(info) {
  return info
}

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //Il max è escluso e il min è incluso
}

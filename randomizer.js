const { nameByRace } = require('fantasy-name-generator')
const faker = require('faker')
// const { Types } = require('mongoose')
const moment = require('moment')
// const IBAN_REGEX = /[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{7}([a-zA-Z0-9]?){0,16}/

module.exports = {
  userInfoRandomizer,
}

function getAge({ birthDate }, date) {
  return birthDate != null ? moment(date).diff(birthDate, 'years') : null
}

function getContacts({ firstName = '', lastName = '', email = '', phone = '' }) {
  return `${firstName} ${lastName} ${email} ${phone}`.trim()
}

function getAddress({ street, streetNumber, zipCode, city, province, country }) {
  if (!street && !streetNumber && !zipCode && !city && !province && !country) {
    return ''
  }
  return `${street ? street + ',' : ''} ${streetNumber || ''} ${zipCode || ''} ${city || ''} ${
    province ? '(' + province + ')' : ''
  } ${country || ''}`.trim()
}

function getFullName({ firstName = '', lastName = '' }) {
  return `${firstName} ${lastName}`.trim()
}

function isBanned({ banStartDate, banEndDate }, date) {
  return banStartDate != null && banEndDate != null && moment(date).isBetween(banStartDate, banEndDate)
}

function userInfoRandomizer(info) {
  //NOTE: for testing purpuses
  // let getFullName, getContacts, getAddress
  // if (!strapi || (strapi && !strapi.models)) {
  //   const userinInfoModel = require('../../userinfo/models/Userinfo')
  //   getFullName = userinInfoModel.getFullName
  //   getContacts = userinInfoModel.getContacts
  //   getAddress = userinInfoModel.getAddress
  // } else {
  //   getFullName = strapi.models.userinfo.getFullName
  //   getContacts = strapi.models.userinfo.getContacts
  //   getAddress = strapi.models.userinfo.getAddress
  // }

  const sexes = ['M', 'F']
  const sex = sexes[getRandomInt(0, 1)]
  const races = [
    'angel',
    'cavePerson',
    'darkelf',
    'dragon',
    'drow',
    'dwarf',
    'elf',
    'fairy',
    'gnome',
    'halfdemon',
    'halfling',
    'highelf',
    'highfairy',
  ]
  const gender = sex === 'F' ? 'female' : 'male'
  let firstName = nameByRace(races[getRandomInt(0, 12)], {
    gender,
  })
  firstName = firstName.length < 3 ? firstName + 'abc' : firstName
  let lastName = nameByRace(races[getRandomInt(0, 12)], {
    gender,
  })
  lastName = lastName.length < 3 ? lastName + 'abc' : lastName
  const birthDate = faker.date.past()
  const email = info.email && faker.internet.email().toLowerCase()
  const phone = info.phone && faker.phone.phoneNumber()

  const streetNumber = getRandomInt(1, 11)
  const street = 'via roma'
  const cities = [
    'Bologna',
    'Brescia',
    'Catania',
    'Firenze',
    'Genova',
    'Milano',
    'Napoli',
    'Roma',
    'Torino',
    'Verona',
  ]
  const city = cities[getRandomInt(0, 10)]
  const zipCode = `0${getRandomInt(0, 10)}100`
  const provinces = ['BO', 'BS', 'CT', 'FI', 'GE', 'MI', 'NA', 'RM', 'TO', 'VR']
  const province = provinces[getRandomInt(0, 10)]

  const country = 'Italy'
  const nameOnTheDoorbell = lastName
  // const taxRegimes = ['flatRateRegime', 'ordinaryRegime']
  const taxRegime = info.taxRegime // taxRegimes[getRandomInt(0, 2)]

  const taxCode =
    info.taxCode &&
    `${lastName.substring(0, 3)}${firstName.substring(0, 3)}${getRandomInt(0, 10)}${getRandomInt(
      0,
      10,
    )}X05X123X`

  const vatCode = info.vatCode && Array.from({ length: 11 }, () => Math.floor(Math.random() * 11)).join('')

  const whereDidYouHearAboutUsChoices = [
    'google',
    'facebook',
    'pharmacy',
    'newspaper',
    'friend',
    'fromCustomer',
    'altro',
  ]
  const whereDidYouHearAboutUs = whereDidYouHearAboutUsChoices[getRandomInt(0, 6)]
  const channel = 'CHANNEL'
  const sources = [
    'form',
    'owner',
    'backoffice',
    'specialistsmanager',
    'hubspot',
    'sample',
    'root',
    'promoter',
  ]
  const source = sources[getRandomInt(0, 7)]
  return {
    ...info,
    firstName,
    lastName,
    email,
    phone,
    fullName: getFullName({
      firstName,
      lastName,
    }),
    contacts: getContacts({
      firstName,
      lastName,
      email,
      phone,
    }),
    street,
    streetNumber,
    zipCode,
    city,
    province,
    country,
    address: getAddress({
      street,
      streetNumber,
      zipCode,
      city,
      province,
      country,
    }),
    nameOnTheDoorbell,
    sex,
    taxRegime,
    taxCode,
    vatCode,
    whereDidYouHearAboutUs,
    channel,
    source,
    birthDate,
    birthPlace: city,
    zones: info.zones,
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //Il max è escluso e il min è incluso
}

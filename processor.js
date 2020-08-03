const { userInfoRandomizer } = require('./randomizer')
const mongodb = require('mongodb')

module.exports = {
  process,
  initialize,
}

let applicationStateTypes = []

async function initialize(data) {
  const { source, target } = data
  // do something like load static data to use in process method

  console.log('Load [applicationstatetype] from source')
  applicationStateTypes = await findIds(source, 'applicationstatetype')
}

function getId(obj) {
  return mongodb.ObjectID.isValid(obj) ? obj : obj._id
}

function normalize(values = {}) {
  const { candidates = [], operations = [], specialist = null, operationInfo = null, owners = [] } = values

  values.specialist = specialist ? getId(specialist) : null
  values.operationInfo = operationInfo ? getId(operationInfo) : null
  values.owners = owners.map((user) => (user ? getId(user) : null))
  values.owners = values.owners.filter((user) => user)
  values.candidates = candidates.map((can) => ({
    operation: can.operation ? getId(can.operation) : null,
    range: can.range,
  }))
  values.operations = operations.map((op) => (op ? getId(op) : null))
  values.operations = values.operations.filter((op) => op)

  return values
}

async function process(collectionName, documents) {
  if (collectionName === 'application') {
    documents = await documents.map((application) => normalize(application))
  }

  // else if (collectionName === 'userinfo') {
  //   documents = await documents.map((userinfo) => {
  //     return userInfoRandomizer(userinfo)
  //   })
  // }

  // do something BUT remember to return documents
  return documents
}

async function findIds(client, collectionName) {
  const ids = []
  await client
    .collection(collectionName)
    .find({})
    .toArray()
    .then(async (documents) => {
      await documents.map((type) => {
        ids[type._id] = type
      })
    })

  return ids
}

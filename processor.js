const { userInfoRandomizer } = require('./randomizer')
const mongodb = require('mongodb')

module.exports = {
  process,
  initialize,
}

// let applicationStateTypes = []
let operations = []
let operationStateTypes = []
let userInfos = []
let specialists = []

async function initialize(data) {
  const { source, target } = data
  // do something like load static data to use in process method

  // console.log('Load [applicationstatetype] from source')
  // applicationStateTypes = await findIds(source, 'applicationstatetype')

  console.log('Load [specialists] from source')
  specialists = await source.collection('specialist').find().toArray()
  console.log('Load [operations] from source')
  operations = await source.collection('operation').find().toArray()
  console.log('Load [userInfos] from source')
  userInfos = await source.collection('userinfo').find().toArray()
}

// async function findAndPopulateState(client, collectionName) {
//   let results = await client.collection(collectionName).find().toArray()
//   console.log('results[0]', JSON.stringify(results[0]))

//   results = results.map((item) => {
//     if (item && item.state && operationStateTypes && operationStateTypes.length > 0) {
//       const state = operationStateTypes.find((ost) => JSON.stringify(ost._id) === JSON.stringify(item._id))
//       item.state = state
//     }

//     return item
//   })

//   return results
// }

function getId(obj) {
  return mongodb.ObjectID.isValid(obj) ? obj : obj._id
}

function normalizeApplication(values = {}) {
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

async function addStates(values = {}) {
  const { _id } = values
  let filteredOperations = operations.filter((op) => JSON.stringify(op.info) === JSON.stringify(_id))

  let states = []
  filteredOperations.forEach((op) => {
    if (op.state) {
      const state = operationStateTypes.find((ost) => JSON.stringify(ost._id) === JSON.stringify(op.state))
      // states.push({
      //   id: op._id,
      //   state,
      // })

      states.push(state.code)
    }
  })

  if (states.length > 0) {
    states = states.filter((state) => state)
    values.operationStates = states.length > 1 ? states.join(',') : states[0]
  }

  return values
}



function getContacts({
  firstName = '',
  lastName = '',
  email = '',
  phone = '',
}) {
  return `${firstName} ${lastName} ${email} ${phone}`.trim()
}


async function addSpecialists(values = {}) {
  const { _id } = values
  let filteredOperations = operations.filter((op) => JSON.stringify(op.info) === JSON.stringify(_id))


  let opSpecialists = []
  await Promise.all( filteredOperations.map(async ost=>{
    const specialist = specialists.find((sp) => JSON.stringify(sp._id) === JSON.stringify(ost.specialist))
    if(specialist){
      const userInfo = userInfos.find((ui) => JSON.stringify(ui._id) === JSON.stringify(specialist.userInfo))
      
      if(userInfo){

      opSpecialists.push(getContacts(userInfo))}
    }
  }))



  if (opSpecialists.length > 0) {
    opSpecialists = opSpecialists.filter((s) => s)
    values.operationSpecialists = opSpecialists.length > 1 ? opSpecialists.join(',') : opSpecialists[0]
  }

  return values
}

async function process(collectionName, documents) {
  // if (collectionName === 'operationinfo') {
  //   documents = await Promise.all(documents.map((info) => addSpecialists(info)))
  // }

  // if (collectionName === 'operationinfo') {
  //   documents = await Promise.all(documents.map((info) => addStates(info)))
  // }

  // if (collectionName === 'application') {
  //   documents = await documents.map((application) => normalizeApplication(application))
  // }

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

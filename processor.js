const { userInfoRandomizer } = require('./randomizer')

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

async function process(collectionName, documents) {
  if (collectionName === 'application') {
    documents = await documents.map((application) => {
      const { state } = application
      return {
        ...application,
        state: applicationStateTypes[state],
        state_backup: state,
        state_backup_date: new Date(),
      }
    })
  } else if (collectionName === 'userinfo') {
    documents = await documents.map((userinfo) => {
      return userInfoRandomizer(userinfo)
    })
  }

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

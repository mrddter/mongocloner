module.exports = {
  process,
  initialize,
}

let applicationStateTypes = []

async function initialize(data) {
  const { source, target } = data
  // do something like load static data to use in process method

  applicationStateTypes = await findIds(source, 'applicationstatetype')
  console.log('Load applicationStateTypes from Source', applicationStateTypes)
}

async function process(collectionName, documents) {
  if (collectionName === 'application') {
    documents = await documents.map((document) => {
      const { state } = document
      return { ...document, state_backup: applicationStateTypes[state] }
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

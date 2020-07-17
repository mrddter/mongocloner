const {
  action,
  urlSource,
  dbSource,
  collectionsSource,
  urlTarget,
  dbTarget,
  collectionsTarget,
  chunks,
  timeOut,
  backupToImportDir,
} = require('./config')

const ACTION_CLONE = 'clone'
const ACTION_APPEND = 'append'
const ACTION_BACKUP_SOURCE = 'backup_source'
const ACTION_DELETE_TARGET = 'delete_target'
const ACTION_IMPORT_BACKUP = 'import_backup' // to target

const fs = require('fs')
const path = require('path')
const moment = require('moment')
const { userInfoRandomizer } = require('./randomizer')
let mongoSource = require('mongodb').MongoClient
let mongoTarget = require('mongodb').MongoClient

const backupDir = path.join('.', 'dump', dbSource, moment().format('YYYYMMDD.HHmmSS'))

if (action === ACTION_BACKUP_SOURCE && !fs.existsSync(backupDir)) {
  console.log('Source', 'backup - path', backupDir)
  fs.mkdirSync(backupDir, { recursive: true })
}

console.log('Source Url:', urlSource)
console.log('Source DB Name:', dbSource)
console.log('Target Url:', urlTarget)
console.log('Target DB Name:', dbTarget)
console.log('Required action:', action)
console.log('-----------------')

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function insertDocuments(name, db, collectionName, documents) {
  try {
    if (documents != null && documents.length > 0) {
      if (collectionName === 'userinfo______') {
        documents = await Promise.all(
          documents.map((userinfo) => {
            return userInfoRandomizer(userinfo)
          }),
        )
      }

      console.log(name, collectionName, '- insert', documents.length, 'documents')
      await db.collection(collectionName).insertMany(documents)
    }
  } catch (err) {
    console.log(name, collectionName, '- insert error', err)
    throw err
  }
}

async function importBackup(collectionSource, dbTarget, collectionTarget, chunks) {
  const fileName = path.join(backupToImportDir, collectionSource + '.json')
  if (fs.existsSync(fileName)) {
    const contents = fs.readFileSync(fileName, 'utf8')

    if (contents != null) {
      let documents = JSON.parse(contents)
      if (documents.length >= 1) {
        console.log('Import backup for', collectionSource, ' documents found:', documents.length)

        let start = 0
        let length = documents.length
        let size = Math.min(documents.length, chunks)

        while (size > 0 && length >= 0) {
          const sliced = documents.slice(start, start + size)
          if (sliced.length == 0) {
            break
          }

          await insertDocuments('Target', dbTarget, collectionTarget, sliced)

          size = Math.min(chunks, length)
          start += chunks
          length -= size
        }
      }
    }
  }
}

async function dropCollection(name, db, collectionName) {
  // console.log(name, collectionName, 'dropping ..')
  const collection = db.collection(collectionName)
  const count = await collection.find().count()
  if (count > 0) {
    await collection.drop()
    console.log(name, collectionName, '- collection deleted')
  } else {
    console.log(name, collectionName, '- nothing to delete')
  }
}

async function countDocuments(dbSource, collectionSource, dbTarget, collectionTarget, callback, limit) {
  try {
    const count = await dbSource.collection(collectionSource).countDocuments()
    // console.log('Source', collectionSource, '- found', count, 'documents')
    if (count > 0) await callback(dbSource, collectionSource, dbTarget, collectionTarget, 0, limit, count)
  } catch (err) {
    console.log('Source', collectionSource, '- error', err)
    throw err
  }
}

function backupDocuments(name, collectionName, documents) {
  try {
    // console.log(name, 'backup', collectionName, '- to write', documents.length, 'documents')
    fs.appendFileSync(path.join(backupDir, collectionName + '.json'), JSON.stringify(documents))
  } catch (err) {
    console.log(name, 'backup', collectionName, '- error', err)
    throw err
  }
}

async function loadClient(mongoClient, url, dbName) {
  try {
    const mongo = await mongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    return { mongo, db: mongo.db(dbName) }
  } catch (err) {
    console.log('Source', err)
  }
}

async function evaluateDocumentsInChunks(
  dbSource,
  collectionSource,
  dbTarget,
  collectionTarget,
  skip,
  limit,
  count,
) {
  if (action === ACTION_DELETE_TARGET) {
    return
  }
  if (skip >= count) {
    console.log('Source', collectionSource, '- all done for', count, 'documents')
    return
  }

  try {
    const documents = await dbSource
      .collection(collectionSource)
      .find({})
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    if (action === ACTION_BACKUP_SOURCE) {
      await backupDocuments('Source', collectionSource, documents)
    } else if (action === ACTION_APPEND || action === ACTION_CLONE) {
      await insertDocuments('Target', dbTarget, collectionTarget, documents)
    }

    timeOut > 0 && (await timeout(timeOut))

    await evaluateDocumentsInChunks(
      dbSource,
      collectionSource,
      dbTarget,
      collectionTarget,
      skip + limit,
      limit,
      count,
    )
  } catch (err) {
    console.log('Source', collectionSource, '- evaluate error', err)
    throw err
  }
}

async function execute() {
  const { mongo: mongoClientSource, db: clientSource } = await loadClient(mongoSource, urlSource, dbSource)
  if (!clientSource) {
    console.log('Mongo client source not valid')
    return
  }

  const { mongo: mongoClientTarget, db: clientTarget } = await loadClient(mongoTarget, urlTarget, dbTarget)
  if (!clientTarget) {
    console.log('Mongo client target not valid')
    return
  }

  await Promise.all(
    collectionsSource.map(async (collectionSource, i) => {
      const collectionTarget = collectionsTarget[i]

      if (action === ACTION_CLONE || action === ACTION_DELETE_TARGET || action === ACTION_IMPORT_BACKUP) {
        await dropCollection('Target', clientTarget, collectionTarget)
      }

      if (action !== ACTION_DELETE_TARGET && action !== ACTION_IMPORT_BACKUP) {
        await countDocuments(
          clientSource,
          collectionSource,
          clientTarget,
          collectionTarget,
          evaluateDocumentsInChunks,
          chunks,
        )
      } else if (action === ACTION_IMPORT_BACKUP) {
        await importBackup(collectionSource, clientTarget, collectionTarget, chunks)
      }
    }),
  )

  console.log('All done')
  setTimeout(() => {
    try {
      console.log('Closing connections..')
      mongoClientSource.close()
      mongoClientTarget.close()
    } catch (err) {
      console.log('Damn, got a error', err)
      throw err
    }

    return process.exit(0)
  }, 3000)
}

execute()

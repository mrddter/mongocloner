const {
  action: configAction,
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
const BSON = require('bson')

const ACTION_CLONE = 'clone'
const ACTION_APPEND = 'append'
const ACTION_BACKUP_JSON = 'backup_json'
const ACTION_BACKUP_YAML = 'backup_yaml'
const ACTION_DELETE_TARGET = 'delete_target'
const ACTION_IMPORT_BACKUP = 'import_backup' // to target
const ACTION_LIST_SOURCE = 'list_source'
const ACTION_LIST_TARGET = 'list_target'
const ACTION_SIZE = 'size'

const ACTIONS = [
  { name: ACTION_CLONE, source: true, target: true },
  { name: ACTION_APPEND, source: true, target: true },
  { name: ACTION_BACKUP_JSON, source: true, target: false },
  { name: ACTION_BACKUP_YAML, source: true, target: false },
  { name: ACTION_DELETE_TARGET, source: false, target: true },
  { name: ACTION_IMPORT_BACKUP, source: false, target: true },
  { name: ACTION_LIST_SOURCE, source: true, target: false },
  { name: ACTION_LIST_TARGET, source: false, target: true },
  { name: ACTION_SIZE, source: true, target: false },
]

const action = ACTIONS.find(actionItem => actionItem.name === configAction)
if (!action) {
  console.log(`Action ${configAction} not valid.`)
  return
}

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const moment = require('moment')
const processor = require('./processor')
let mongoSource = require('mongodb').MongoClient
let mongoTarget = require('mongodb').MongoClient

const backupDir = path.join('.', 'dump', dbSource, moment().format('YYYYMMDD.HHmmSS'))

if ((action.name === ACTION_BACKUP_JSON || action.name === ACTION_BACKUP_YAML) && !fs.existsSync(backupDir)) {
  console.log('Source', 'backup - path', backupDir)
  fs.mkdirSync(backupDir, { recursive: true })
}

console.log('Source Url:', urlSource)
console.log('Source DB Name:', dbSource)
console.log('Target Url:', urlTarget)
console.log('Target DB Name:', dbTarget)
console.log('Required action:', action.name)
console.log('-----------------')

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function backupDocuments(name, collectionName, documents, format) {
  try {
    if (format === 'json') {
      fs.appendFileSync(path.join(backupDir, collectionName + '.json'), JSON.stringify(documents), 'utf-8')
    } else if (format === 'yaml') {
      const data = yaml.safeDump(documents)
      fs.appendFileSync(path.join(backupDir, collectionName + '.yaml'), data, 'utf-8')
    }
  } catch (err) {
    console.log(name, 'backup', collectionName, '- error', err)
    throw err
  }
}

async function insertDocuments(name, db, collectionName, documents) {
  try {
    if (documents != null && documents.length > 0) {
      documents = await processor.process(collectionName, documents)

      console.log(name, collectionName, '- insert', documents.length, 'documents')
      if (documents && documents.length > 0) {
        await db.collection(collectionName).insertMany(documents)
      }
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
  clientSource,
  collectionSource,
  clientTarget,
  collectionTarget,
  skip,
  limit,
  count,
) {
  if (action.name === ACTION_DELETE_TARGET) {
    return
  }
  if (skip >= count) {
    console.log('Source', collectionSource, '- all done for', count, 'documents')
    return
  }

  try {
    const documents = await clientSource
      .collection(collectionSource)
      .find({})
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    if (action.name === ACTION_BACKUP_JSON) {
      await backupDocuments('Source', collectionSource, documents, 'json')
    } else if (action.name === ACTION_BACKUP_YAML) {
      await backupDocuments('Source', collectionSource, documents, 'yaml')
    } else if (action.name === ACTION_APPEND || action.name === ACTION_CLONE) {
      await insertDocuments('Target', clientTarget, collectionTarget, documents)
    } else if (action.name === ACTION_SIZE) {
      documents.forEach(document => {
        const size = BSON.calculateObjectSize(document)
        if (size > 102400)
          console.log(
            '_id: ' +
              document._id +
              ' || Size: ' +
              size +
              'B -> ' +
              Math.round(size / 1024) +
              'KB -> ' +
              Math.round(size / (1024 * 1024)) +
              'MB',
          )
      })
    }

    timeOut > 0 && (await timeout(timeOut))

    await evaluateDocumentsInChunks(
      clientSource,
      collectionSource,
      clientTarget,
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
  let mongoClientSource = null
  let clientSource = null

  if (action.source) {
    const { mongo, db } = await loadClient(mongoSource, urlSource, dbSource)
    mongoClientSource = mongo
    clientSource = db
    if (!clientSource) {
      console.log('Mongo client source not valid')
      return
    }
  }

  let mongoClientTarget = null
  let clientTarget = null

  if (action.target) {
    const { mongo, db } = await loadClient(mongoTarget, urlTarget, dbTarget)
    mongoClientTarget = mongo
    clientTarget = db
    if (!clientTarget) {
      console.log('Mongo client target not valid')
      return
    }
  }

  await processor.initialize({ source: clientSource, target: clientTarget })

  if (action.name === ACTION_LIST_SOURCE || action.name === ACTION_LIST_TARGET) {
    const client = action.name === ACTION_LIST_SOURCE ? clientSource : clientTarget
    const prefix = action.name === ACTION_LIST_SOURCE ? 'SOURCE' : 'TARGET'

    await client
      .listCollections()
      .toArray()
      .then(collections => {
        const names = collections
          .filter(c => c.type === 'collection')
          .map(c => c.name)
          .sort()
        console.log(`${prefix}_COLLECTIONS=` + names)
      })
  } else {
    await Promise.all(
      collectionsSource.map(async (collectionSource, i) => {
        const collectionTarget = collectionsTarget[i]

        if (
          action.name === ACTION_CLONE ||
          action.name === ACTION_DELETE_TARGET ||
          action.name === ACTION_IMPORT_BACKUP
        ) {
          await dropCollection('Target', clientTarget, collectionTarget)
        }

        if (action.name !== ACTION_DELETE_TARGET && action.name !== ACTION_IMPORT_BACKUP) {
          await countDocuments(
            clientSource,
            collectionSource,
            clientTarget,
            collectionTarget,
            evaluateDocumentsInChunks,
            chunks,
          )
        } else if (action.name === ACTION_IMPORT_BACKUP) {
          await importBackup(collectionSource, clientTarget, collectionTarget, chunks)
        }
      }),
    )
  }

  console.log('All done')
  setTimeout(() => {
    try {
      console.log('Closing connections..')
      action.source && mongoClientSource.close()
      action.target && mongoClientTarget.close()
    } catch (err) {
      console.log('Damn, got a error', err)
      throw err
    }

    return process.exit(0)
  }, 3000)
}

execute()

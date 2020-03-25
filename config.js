const action = process.env.ACTION
const urlSource = process.env.SOURCE_URI
const dbSource = process.env.SOURCE_DATABASE
const collectionsSource = process.env.SOURCE_COLLECTIONS.split(',')
const urlTarget = process.env.TARGET_URI
const dbTarget = process.env.TARGET_DATABASE

let collectionsTarget = process.env.TARGET_COLLECTIONS
  ? process.env.TARGET_COLLECTIONS.split(',')
  : collectionsSource

collectionsTarget =
  collectionsTarget && collectionsTarget.length === collectionsSource.length
    ? collectionsTarget
    : collectionsSource

const chunks = Number(process.env.CHUNK_SIZE) // 100;
const timeOut = Number(process.env.TIMEOUT) // 7000;

module.exports = {
  action,
  urlSource,
  dbSource,
  collectionsSource,
  urlTarget,
  dbTarget,
  collectionsTarget,
  chunks,
  timeOut,
}

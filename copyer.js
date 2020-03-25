const {
  urlSource,
  dbSource,
  collectionsSource,
  urlTarget,
  dbTarget,
  collectionsTarget,
  chunks,
  timeOut,
  action
} = require("./config");

const ACTION_CLONE = "clone";
const ACTION_APPEND = "append";
const ACTION_BACKUP_SOURCE = "backup_source";
const ACTION_DELETE_TARGET = "delete_target";

let fs = require("fs");
let path = require("path");
let moment = require("moment");
let mongoClientSource = require("mongodb").MongoClient;
let mongoClientTarget = require("mongodb").MongoClient;

const backupDir = path.join(
  ".",
  "dump",
  dbSource,
  moment().format("YYYYMMDD.HHmmSS")
);

console.log("Source Url", urlSource);
console.log("Source Url", dbSource);
console.log("Target Url", urlTarget);
console.log("Target DB", dbTarget);
console.log("Action", action);
console.log("-----------------");

if (action === ACTION_BACKUP_SOURCE && !fs.existsSync(backupDir))
  fs.mkdirSync(backupDir, { recursive: true });

for (let i = 0; i < collectionsSource.length; i++) {
  let collectionSource = collectionsSource[i];
  let collectionTarget = collectionsTarget[i];

  if (action === ACTION_CLONE || action === ACTION_DELETE_TARGET) {
    dropCollectionFromTarget(collectionTarget);
  }

  function copyDocumentsInChunks(skip, limit, count) {
    if (action === ACTION_DELETE_TARGET) {
      return;
    }
    if (skip >= count) {
      console.log("Source", collectionSource, "- done");
      return;
    }

    mongoClientSource.connect(
      urlSource,
      { useUnifiedTopology: true, useNewUrlParser: true },
      function(error, mongo) {
        if (error) throw error;

        let db = mongo.db(dbSource);
        db.collection(collectionSource)
          .find({})
          .sort({ _id: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(function(err, result) {
            if (err) throw err;

            if (action === ACTION_BACKUP_SOURCE)
              backupDocuments(collectionTarget, result);
            else if (action === ACTION_APPEND)
              insertDocuments(collectionTarget, result);
            else if (action === ACTION_CLONE)
              insertDocuments(collectionTarget, result);

            setTimeout(
              copyDocumentsInChunks,
              timeOut,
              skip + limit,
              limit,
              count
            );

            //copyDocumentsInChunks(skip + limit, limit, count);
            mongo.close();
          });
      }
    );
  }

  function dropCollectionFromTarget(collectionTarget) {
    mongoClientTarget.connect(
      urlTarget,
      { useUnifiedTopology: true, useNewUrlParser: true },
      function(error, mongo) {
        if (error) throw error;

        let db = mongo.db(dbTarget);
        db.collection(collectionSource)
          .countDocuments()
          .then(count => {
            count >= 0 &&
              db.collection(collectionTarget).drop(function(err, result) {
                if (err) throw err;
                if (result)
                  console.log(
                    "Target",
                    collectionTarget,
                    "- collection deleted"
                  );
                mongo.close();
              });
          });
      }
    );
  }

  function insertDocuments(collectionTarget, documents) {
    mongoClientTarget.connect(
      urlTarget,
      { useUnifiedTopology: true, useNewUrlParser: true },
      function(error, mongo) {
        if (error) throw error;

        let db = mongo.db(dbTarget);
        db.collection(collectionTarget).insertMany(documents, function(
          err,
          result
        ) {
          if (err) throw err;
          mongo.close();
        });
      }
    );
  }

  function backupDocuments(collectionTarget, documents) {
    fs.appendFileSync(
      path.join(backupDir, collectionSource + ".json"),
      JSON.stringify(documents)
    );
  }

  function countDocumentsDBSource(callback, limit) {
    mongoClientSource.connect(
      urlSource,
      { useUnifiedTopology: true, useNewUrlParser: true },
      function(error, mongo) {
        if (error) throw error;

        let db = mongo.db(dbSource);
        db.collection(collectionSource)
          .countDocuments()
          .then(count => {
            callback(0, limit, count);
            mongo.close();
          });
      }
    );
  }

  countDocumentsDBSource(copyDocumentsInChunks, chunks);
}

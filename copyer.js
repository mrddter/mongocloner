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
const ACTION_BACKUP = "backup_source";

let fs = require("fs");
let path = require("path");
let moment = require("moment");
let mongoClientSource = require("mongodb").MongoClient;
let mongoClientTarget = require("mongodb").MongoClient;

const backupDir = path.join(".", "dump", moment().format("YYYYMMDD.HHmmSS"));

if (action === ACTION_BACKUP && !fs.existsSync(backupDir))
  fs.mkdirSync(backupDir, { recursive: true });

for (let i = 0; i < collectionsSource.length; i++) {
  let collectionSource = collectionsSource[i];
  let collectionTarget = collectionsTarget[i];

  if (action === ACTION_CLONE) dropCollectionFromTarget(collectionTarget);

  function copyDocumentsInChunks(skip, limit, count) {
    if (skip >= count) {
      console.log("Source", collectionSource, " - done");
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

            if (action === ACTION_BACKUP)
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
        db.collection(collectionTarget).drop(function(err, delOk) {
          if (err) throw err;
          if (delOk)
            console.log("Target", collectionTarget, "- collection deleted");
          mongo.close();
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
    mongoClientSource.connect(urlSource, { useNewUrlParser: true }, function(
      error,
      mongo
    ) {
      if (error) throw error;

      let db = mongo.db(dbSource);
      db.collection(collectionSource)
        .countDocuments()
        .then(count => {
          callback(0, limit, count);
          mongo.close();
        });
    });
  }

  countDocumentsDBSource(copyDocumentsInChunks, chunks);
}

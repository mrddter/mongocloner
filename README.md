# mongocloner

a simple utility to clone data on mongo

## fully BASED on

[NodeJS_Copy_Collection](https://github.com/matszrmn/NodeJS_Copy_Collection/tree/master/src)

1. first of all create/change your .env
1. install with yarn
1. run with "yarn dev" or "yarn start" (it's the same)

## Installation

- fork or clone this repo
- create your own `.env`
- execute `yarn` to install all the stuff
- execute `yarn dev` to execute it
- that's all

## Content of .env

```env

# Possible ACTIONs --> backup_source, append, clone
ACTION=backup_source
CHUNK_SIZE=50000
TIMEOUT=60000

SOURCE_URI=mongodb+srv://YOUR-SOURCE-USR:YOUR-SOURCE-PASSWORD@mongocluster-12345.mongodb.net/YOUR-SOURCE-DB
SOURCE_DATABASE=YOUR-SOURCE-DB

TARGET_URI=mongodb+srv://YOUR-TARGET-USR:YOUR-TARGET-PASSWORD@mongocluster-12345.mongodb.net/YOUR-TARGET-DB
TARGET_DATABASE=YOUR-TARGET-DB

# List of collections to read (comma separated)
SOURCE_COLLECTIONS=collection1,collection2,collection3,collection4,collection5

# Void if the same of SOURCE or others name (in the same number)
TARGET_COLLECTIONS=

```

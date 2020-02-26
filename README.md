# mongocloner

A simple utility to clone, append or backup data from a mongo URI.

With this tool you can do different actions:

- `backup_source`: backup specified collections from a wellknown mongo uri
- `append`: append specified collections from a wellknown mongo uri to another
- `clone`: drop and clone specified collections from a wellknown mongo uri to another

## Fully BASED on

First of all, thanks to **Matheus Mendes de Sant'Ana** ([profile](https://github.com/matszrmn)) for share [NodeJS_Copy_Collection](https://github.com/matszrmn/NodeJS_Copy_Collection/tree/master/src).

## Important note

This code is not optimized and is not designed for production. It's is usable in development contest with small collections. But if you want submit a PR to improve this utility or feel free to use it in your project (if is possible send me a message to let me know it).

## Installation

1. `fork` or `clone` this repo
1. create your own `.env`
1. execute `yarn` to install all the stuff
1. execute `yarn dev` or `yarn start` (it's the same) to execute it
1. that's all

## Content of .env

```javascript

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

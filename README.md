[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# mongocloner

A simple utility to drop, clone, append or backup data from a mongo URI to another.

With this tool you can do different actions:

- `backup_json`: backup specified collections from the source in json format
- `backup_yaml`: backup specified collections from the source in yaml format
- `append`: append specified collections from a wellknown mongo uri to another
- `delete_target`: drop specified collections from the target
- `clone`: drop and append specified collections from a wellknown mongo uri to another

## Fully BASED on

First of all, thanks to **Matheus Mendes de Sant'Ana** ([profile](https://github.com/matszrmn)) for share [NodeJS_Copy_Collection](https://github.com/matszrmn/NodeJS_Copy_Collection/tree/master/src).

## Important note

This code is not optimized and is not designed for production. It's is usable in development contest with small collections. Feel fre to submit a PR to improve this utility. And feel free to use it in your project (send me a message if you want, it's really appreciated).

## Installation

1. `fork` or `clone` this repo
1. create your own `.env`
1. execute `yarn` to install all the stuff
1. execute `yarn dev` or `yarn start` (it's the same) to execute it
1. that's all

## Command line

Not necessary.

## Content of .env

```ruby

# Possible ACTIONs --> backup_json, backup_yaml, append, clone, delete_target
ACTION=backup_source
CHUNK_SIZE=10000
TIMEOUT=3000

SOURCE_URI=mongodb+srv://YOUR-SOURCE-USR:YOUR-SOURCE-PASSWORD@mongocluster-12345.mongodb.net/YOUR-SOURCE-DB
SOURCE_DATABASE=YOUR-SOURCE-DB

TARGET_URI=mongodb+srv://YOUR-TARGET-USR:YOUR-TARGET-PASSWORD@mongocluster-12345.mongodb.net/YOUR-TARGET-DB
TARGET_DATABASE=YOUR-TARGET-DB

# List of collections to read (comma separated)
SOURCE_COLLECTIONS=collection1,collection2,collection3,collection4,collection5

# Void if the same of SOURCE or is possible to specify different names
# (but with the same number of collections, and pay attention to the order because matters)
TARGET_COLLECTIONS=

```

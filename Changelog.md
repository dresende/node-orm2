### v2.1.15 - 05 Jun 2014
- Feature: Enable plugging in custom third-party drivers (now known as adapters) (#512)
- Add Instance.set() so that properties of type object can have their properties set and mark model as dirty (#517)
- Add Instance.markAsDirty(propName) to force a properties state to dirty/changed.
- Enable Property.mapsTo for keys (#509)
- Fix hasMany join tables with custom key columns (#510)

### v2.1.14 - 22 May 2014
- Allow explicitly specifying `key: true` on properties rather than passing in an array of ids.
- Fix Property.mapsTo (#506)

### v2.1.13 - 21 May 2014
- Dont modify array passed to execQuery

### v2.1.12 - 20 May 2014
- Add custom-type support to hasMany extra properties.
- Fix SQLite index name collisions (#499)

### v2.1.11 - 19 May 2014
- Fix hasMany.getAccessor().count()

### v2.1.10 - 09 May 2014
- Fix sqlite Dialect.clear - resets incremental counters (#497)

### v2.1.9 - 06 May 2014
- Add basic PostGIS support - (#456, #375)
- Allow mapping model properties to differently named columns (#273, #495)

### v2.1.8 - 28 Apr 2014
- Fix '.omit' (#491)

### v2.1.7 - 25 Apr 2014
- Add explicit 'integer' type to avoid confusion.
  `type: 'number', rational: false` will auto convert to `type: 'integer'`.

### v2.1.6 - 23 Apr 2014
- Add '.omit' to chain find - opposite of '.only'

### v2.1.5 - 08 Apr 2014
- Don't create indexes for primary/composite keys; they are created automatically (#484)

### v2.1.4 - 19 Mar 2014
- Fix TypeScript module declaration (#362)
- Fixes reversed hasOne.getAccessor when called without callback (#267)
- Fixes default pool value (#366)
- Fixes erroneous misformatting of top-level $and/$or clauses (#365)
- Fix and improve TypeScript declaration (#369)
- Use local as default timezone, pass timezone option to Query (#325)
- Postgres: always save object as Buffer (#378)
- Postgres: fix queries for prop create index, and for primary keys (#377)
- Typo in property definition (#382)
- Implement eager loading - huge performance win (#393)
- Make model methods defined by `defineProperty` writable so they can be mocked (#399)
- Allow composite keys when calling remove. (#345, #358)
- Fixed bug on like expression using MongoDB (#403)
- Fixes pool and debug settings always true (#405)
- Update express middleware for express.io (#413)
- Allow HasMany.setAccessor to take an empty array
- Fix DML if object value is null, JSON.stringify return string 'null' (#380)
- Correct sqlite log statement (#452)
- Make association methods writable so they can be mocked (#451)
- Throw ORM errors rather than generic ones (#455)
- Fix sqlite3 driver with config object on windows (#461)
- Fix 'No associations defined' error (#398)
- Don't modify connection object (#469)
- Don't fire afterSave hooks when calling save with no changes (#457)
- Fix reverse has one association findBy* (#450)
- Auto cast hasMany extra properties with types like 'Object' (#466)
- Add example full featured express app - AnonTXT

### v2.1.3 - 14 Oct 2013

- Fixes connection strings being parsed by url module to don't forget about port :) (#355)
- Fixes tests common.getConnectionString to use common.getConfig
- Converts indentation from spaces:2 to tabs
- Removes unnecessary path requirement in ORM.js
- Changes user methods to be writeable property instances (fixes #296)
- Fixes afterAutoFetch next(err) bubling up just like afterLoad (#301)
- Fixes cache for hasOne associations (#339)
- Adds findByAssociation to extendsTo (#314)
- Fixes Model.extendsTo autoFetch not working (throwing) (#323)
- Adds hasMany hooks.beforeSave (#324)

### v2.1.2 - 16 Sep 2013

- Fixes stack overflow on instance.save() with a reversed hasOne association (#338)
- Reverts should dev dependency to 1.2.2 (newer version was causing problems)
- When using postgres you can now use pg@2.6.2 (unless when connecting to Heroku - use 2.5.0)

### v2.1.1 - 13 Sep 2013

- Add TypeScript interface
- Allow custom join tables (#276)
- Fixes stack overflow when saving auto-fetched model with relations (#279)
- Unique validator can be scoped and case insensitive (#288)
- Allow async express middleware (#291)
- Allow finding by associations (#293)
- Fix sqlite find with boolean (#292)
- Fix `afterLoad` hook error handling (#301)
- Allow auto-escaping for custom queries (#304)
- Add support for custom property types (#305)
- Allow ordering by raw sql - .orderRaw() when chaining (#308, #311)
- Fix saving Instance.extra fields (#312)
- Fix `NaN` handling (#310)
- Fix incorrect SQL query (#313)
- Deprecated `PARAM_MISSMATCH` ErrorCode in favour of correctly spelt `PARAM_MISMATCH` (#315)
- Add promises to query chain (#316)
- Adds a test for hasMany.delAccessor with arguments switched (#320)
- Allow passing timezone in database connection string, local timezone is now default (#325, #303)
- Adds ability to call db.load() with multiple files (closes #329)
- For mysql driver, when using pool, use con.release() instead of con.end() (if defined) (closes #335)
- Passes error from afterLoad hook to ready event
- Most errors now have a model property
- Adds connection.pool and connection.debug settings
- Fixes throw when calling ChainFind.first() or .last() and it has an error
- Removes upper limit on VARCHAR column size
- Allows multi-key models to support hasMany

### v2.1.0 - 3 Aug 2013

- Adds License (MIT) file (closes #271)
- Make Model.get respect Model autoFetch default value (#277)
- Changes the way ":" is added to sqlite db paths (#270)
- Fixes duplicated debug lines for postgres (#258)
- Fixes not saving associations if no changes (other than associations) are made (#256)
- Fixes autoFetch being discarded in Model.get options (closes #266)
- Adds beforeDefine to plugins (#263)
- Allows user to pass an object to extendsTo.setAccessor instead of an instance (detected via #250)
- Changes autoFetch to avoid autofetching if instance is not saved (it's new!) (#242)
- Changes validations and predefined validators to use enforce@0.1.1
- Adds support for setting properties.association_key to be a function (name, field)
- Passes connection settings to database drivers
- Creates initial mongodb driver and 'mongo' driver alias
- Allow querying chainfind with sql conditions
- Allow passing extra options to extended models
- Allow big text fields
- Allow before* hooks to modify the instance
- Fixes #226 - hasOne delAccessor not working
- Adds Utilities.getRealPath to look for the real path to load based on the file where it was called from (for db.load and db.use)
- Fixes Model.aggregate().call() to accept no arguments except function name
- Fix problem with extendsTo and custom key types
- Better association typing and multikey support

### v2.0.15 - 10 July 2013

- Support for 'point' type as a property (#221)
- .call() in aggregates for generic functions (#204)
- Adds hook afterAutoFetch triggered after extending and auto fetching (if any) associations (#219)
- Adds predefined validator .password()
- Adds ability to have the afterLoad hook blocking (#219)
- Changes Model.create() to wait for createInstance callback instead of using the returned value
- Fixes problem with hasOne associations for none persisted instances and autoFetch active just blocking
- Refactored Model.hasOne() constructor to be able to mix parameters
- Fixes reversed hasOne association on the reversed model not being correctly saved (#216)
- Changes Model.hasMany.addAccessor to throw just like .setAccessor when no associations are passed
- Adds ability to pass an Array to hasMany.hasAccessor and also not passing any instance to hasAccessor and have it check for any associated item
- Exposes Model methods to change hooks after model definition
- Fixes postgres driver not returning numbers for number columns
- Fixes passing json object instead of instances to Model.create() associations (#216)
- Passes Model to Instance directly, changes Instance to use Model.properties instead of opts.properties
- Exposes Model.properties
- Removes old Property.js throw error in favour of new one
- Adds initial Model.extendsTo(name, properties[, opts])
- Avoids redefining properties in instances
- Adds ErrorCodes.NOT_DEFINED
- Adds db.drop() - similar to db.sync()
- Changes hasMany.getAccessor to support order as string (closes #196)
- Handle django string formatted sqlite datetime
- Many bug fixes

### v2.0.14 - 27 June 2013

- Changes many errors to use the ErrorCodes generator (#206)
- Changes Model.aggregate() to support multiple orders when calling .order() (#207)
- Changes Readme.md sqlite3 version and adds warning.
- Fix wrong import of debug output for aggregate functions
- Fix orm when running on node v0.6 (at least) and module not found error has no code property
- Adds model.namePrefix setting (#203)
- Fixes bug when passing an array (object) of ids but no options object
- Only mark model as dirty if a property has _really_ changed
- Fix hasOne infinite loop
- WIP: Fix hasOne infinite loop & migrate tests to mocha
- Fixes ipv4 predefined validator match string (it was not matching correctly!)
- Fixes Model.get() when passing cache: false and model has cache: true
- Creates Singleton.clear() to clear cache, exports singleton in orm
- Fix required property model.save only threw a single error with returnAllErrors = true
- Fixes some hasMany association usage of Association.id to check for real id property name (#197)
- Changes db.load() to return value from loaded and invoked function (#194)
- Adds possibility to add a callback to ChainFind.find() (#190)
- Adds .findByX(...) to .hasOne("X", ...)
- Allow db.load() to work outside of module.exports
- Fix mysql driver for non-autoincrement key
- Test framework moving to mocha, not complete yet
- Adds `make cov` to make for a test coverage
- Many other bug fixes

### v2.0.13 - 5 June 2013

- Avoids throwing when calling db.close() without a callback and using pool in mysql (fixes #180)
- Adds initial code to support passing associations when creating new instances (#162)
- Changes Model.exists() to allow array or object passing
- Allows passing an object instead of an instance as an hasOne asssociation
- Fixes bug introduced in 2.0.12 forcing extra properties being ignored (fixes #183)

### v2.0.12 - 30 May 2013

- New plugin: orm-paging
- Adds Model.one() as an alias for Model.all().limit(1) (#148)
- Changes Model.one() to return only one instance (or null) instead of an Array (#148)
- Allow passing a single object to Model.create() (#159)
- Fixes passing unknown properties to new instances (fixes #178)
- Adds AggregateFunctions.limit() (#172)
- Checks for driver debug flag and prints debug lines in AggregateFunctions (#171)
- Added Hook 'beforeValidation' prior to _all_ validations
- Avoids JSON parsing values when they are already objects (and not string buffers) (#168)
- Changes beforeRemove, beforeCreate, beforeSave and beforeValidation to use Hooks.wait() (sync or async hooks) (#167)
- Support specifying size of number columns
- Many more bug fixes
- More tests added
- Many documentation improvements

### v2.0.11 - 3 May 2013

- Changes orm.connect() to return an EventEmitter
- Avoids saving an instance if a property is null and is marked as required (#142)
- Avoids passing property validations if property is null and is not required (#142)
- Fixes documentation where user should be used instead of username in connection options (closes #145)
- Adds postgresql schema support
- Fixes autoFetchLimit and cascadeRemove options not being used when set to 0 or false (fixes #144)

### v2.0.10 - 25 Apr 2013

- Adds ChainFind.where() as a link to ChainFind.find()
- Adds support for -property on ChainFind.order()
- Reduces the size of mysql driver
- Adds initial support for multi primary key models
- Updates DB.define() and Model.get() to support tables with multiple primary keys (#135)
- Creates Model.all() as alias to Model.find(), adds simple example
- Fixes autoFetch option not being considered in Model.find() (#120)
- Adds support for chaining and rechaining with ChainFind
- Fixes bug about connection config object not having query key (fixes #130)
- Adds initial plugin architecture - .use() (#121)
- Fixes some bugs
- Adds more tests

### v2.0.9 - 18 Apr 2013

- Correct 'returnAllErrors' setting behaviour
- Adds default settings properties.required = false (#110)
- Changes instance.save() to support an hash of changes before saving (#111)
- Adds setting connection.reconnect (default=false) to auto-reconnect (only mysql for now) (#112)
- Adds possibility of .order() to aggregate method (#114)
- Adds .select() aggregate function to support additional properties to be selected (#114)
- Adds .as() aggregate function to define alias to previous function (#123)
- Adds .distinct() aggregate function to all drivers (#123)
- Changes model.find() queries to specify columns instead of selecting * from tables (#106)
- Changes hasMany.addAccessor to support arrays of instances (#97)
- Adds support for descending ordering using "-property" (#115)
- Adds pool support to postgres driver
- Removes postgres axomic driver
- Updates redshift driver to use new postgres driver
- Adds .validate() model to instances
- Adds more tests
- Some documentation updates
- Some bug fixes

### v2.0.8 - 8 Apr 2013

- Adds more aggregate functions to the several drivers
- Adds groupBy to aggregate methods (#99)
- Adds possibility to use "-property" to indicate a descending order in Model.find()
- Adds setting instance.returnAllErrors (default: true)
- Changes hasMany.setAccessor to support passing an array of instances (#97)
- Fixes property defaultValue not being set if property is null (closes #104)
- Adds support for indexes on properties that are no associations (#98)
- Adds a new option to add multi-column indexes to models (#98)
- Bug fixes

### v2.0.7 - 3 Apr 2013

- Fixed SQLite driver writing to console when it should not
- Changes Express middleware to wait for connections (errored or not) before processing requests (#92)
- Avoids loosing previously set limit (if set) on Model.fin() (#93)
- Fixes hasMany getAccessor when using an Array as only argument (specific properties)
- Adds ChainFind .last() (similar to .first())
- Fixes hasMany acessor names to correctly convert prop_name to PropName (underscores)
- Adds hasMany hasAcessor conditional to ChainFind (#94)

### v2.0.6 - 22 Mar 2013

- Changes orm.connect to check connection url/opts to avoid throwing some errors about missing protocol or database (#75)
- Hardens some validators againt null/undefined, changes match validator to avoid compiling regex everytime it's called
- Changes back default instance properties to null instead of undefined
- Changes Express middleware to be able to have more than one connection (#76)
- Changes Singleton to avoid cache if save_check option is enabled and cached instance is not saved (#78)
- Adds Model.aggregate()
- Adds 'required' option to hasOne associations
- Changes singleton uid creation to use driver uid (#86)
- Changes Model.drop and Model.sync to be resistive to no callback
- Changes ORM.sync() to also be resistant to no callback
- Many bug fixes

### v2.0.5 - 13 Mar 2013

- Uses sql-query for SQL query building
- Adds initial middleware for Express
- Moves beforeCreate to near beforeSave so people can change instance just like beforeSave (#69)
- Fixes bug when creating Models without all data (#69)
- Changes drivers.count() to be able to pass options (related to #68)
- Changes postgres DDL to create ENUM types before table (#71)
- Changes hasOne.getAccessor to be able to fetch instance before association (if needed)
- Adds support for Object property type in DDL drivers (#72)

### v2.0.4 - 7 Mar 2013

- Changes db.load() to behave like builtin require()
- Moves hook beforeSave to before checking validations (#66)
- Changes postgres driver to support ssl flag and pass it to pg driver
- Adds possibility to add order to hasMany getAccessor (#58)
- Fixes hasOne reversed associations not having setAccessor
- Adds db.ping() (#57)
- Changes db.load to avoid throwing and just create the error
- Added "afterRemove" hook
- Added "afterCreate" hook
- Support Model.find({ prop: null }) (closes #59)
- Adds LIKE operator
- Many bug fixes

### v2.0.3 - 26 Feb 2013

- Fixes postgresql integer columns (#52)
- Adds boolean support for sqlite (#50)
- Fixes an issue where hasMany association properties were not being checked (#49)
- Changes hasMany associations to be able to make some call without callback
- Makes Instances trigger beforeRemove event
- Creates default option for instance.cascadeRemove (true)
- Fixes unique validator not using Model id property name (was using hard coded "id")
- Updated documentation

### v2.0.2 - 21 Feb 2013

- Forces hasMany association changes to check for instance saved (to ensure the instance has an id property)
- Fixes some bugs when not using "id" as instance id property
- Adds default setting instance.cache = true so people can tweak it globally
- Adds autoFetch and autoSave options to default settings
- Adds more documentation about Hooks, fixes Model options list ending

### v2.0.1 - 21 Feb 2013

- Changes singleton to support cache value as a number (timeout in seconds)
- Fixes bug when escaping boolean values in postgres
- Fixes bug on Model.sync (postgres) when property has default value (using wrong path to escape method)
- Fixes DDL drivers creating duplicated field in reversed hasOne associations
- Changes Model instanciation to extend association properties
- Adds support to Amazon Redshift based on PostgreSQL driver

### v2.0.0 - 21 Feb 2013

- Initial release

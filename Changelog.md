### v2.0.15 - 10 Jul 2013

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

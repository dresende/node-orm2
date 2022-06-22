### v7.1.0
- Add `isDirty` function to instances ([859](../../pull/859))

### v7.0.0
- Update `async` package from v2 to v3 to resolve security vulnerabilities ([858](../../pull/858))
- Drop support for node < 6 (due to `async` package update)

### v6.2.0
- [Feature] Add `.driver.generateQuery` function - same as `.driver.execQuery` but returns the SQL instead of executing it ([857](../../pull/857))

### v6.1.0
- [Feature] Accept options when calling `Model.create` ([856](../../pull/856))

### v6.0.0
- [POSSIBLY BREAKING] Set internal default property value to `undefined` instead of `null` ([855](../../pull/855)).
  - This will prevent `null` values being explicitly sent to the database when no value was assigned and instead result in the database setting the column to null, or generating a default value.
  - Properties with an internal value of `undefined` will still return `null` when accessed.
  - Setting a previously filled property to `undefined` will still set it to null in the DB.
  - No ORM tests were broken by this change, and as such, the impact of this should be limited to a very small number of corner cases.
- Add PostgreSQL `uuid` column support ([855](../../pull/855)).
- Allow specifying `defaultExpression` (eg. `uuid_generate_v4()` for PostgreSQL or `uuid()` for MySQL) to be executed by the database engine for generating default values ([855](../../pull/855)).

### v5.0.9
- Add async versions of driver functions ([851](../../pull/851))

### v5.0.8
- Improve Typescript typings - add offset prop to find options ([850](../../pull/850))

### v5.0.7
- Resolve security vulnerabilities

### v5.0.6
- Update packages to resolve security vulnerabilities
- Test against modern nodejs versions only [10..16]
- If using Postgres and Nodejs v14+, you must use `pg` driver >= 8.1. The cause of this is unclear, but tests timeout.

### v5.0.5
- Update lodash & sql-ddl-sync version to address security vulnerabilities ([845](../../pull/845))
- Node 11+ support (stable sort; see https://github.com/nodejs/node/issues/24294 for details)
- Test against node 12 & 13

### v5.0.4
- Update sql-query version to address security vulnerabilities ([841](../../pull/841))

### v5.0.3
- Update dependencies to address security vulnerabilities

### v5.0.2
- Fix rare crash when object slips into postgres `escapeValue` ([dresende/node-sql-query#54](https://github.com/dresende/node-sql-query/pull/54)) ([#833](../../pull/833))

### v5.0.1
- Update sql-ddl-sync (no functionality changes; lodash update)

### v5.0.0
- Update dependencies ([#830](../../pull/830))
  - You need to upgrade `pg` in your project to version 7.x. Older versions are no longer supported.
  - Postgres driver now has an error handler. You will need to add an error listener the the ORM instance returned by `connect` function, otherwise any errors will crash your application as per the [EventEmitter documentation](https://nodejs.org/api/events.html#events_error_events). This makes the Postgres driver consistent with other drivers supported by ORM (those however have reconnecting functionality, which prevents the error from surfacing). Due to the lack of reconnecting functionality, you should set `connection.reconnect` to `false` to avoid connection errors.
  - Drop support for nodejs < 4 (required due to `pg` v 7 upgrade)

### v4.0.2
- Fix timezone bug in sqlite ([822](../../pull/822)]

### v4.0.1
- Fix undefinedAsync accessor methods.

### v4.0.0
- Added Promise support (see readme & wiki) ([#807](../../pull/807))

### v3.2.4
- Update dependencies

### v3.2.3
- Upgrade `enforce` package to improve TLD validation ([#763](../../issues/763))

### v3.2.2
- Fix the fix in [#761](../../issues/761) so that it works with custom keys ([#762](../../issues/762))

### v3.2.1
- Fix has many 'has' accessor failing when join table has duplicate entries ([#761](../../issues/761))

### v3.2.0
- Make [.find|.where|.all] synonyms & allow them to chain multiple times
- Update dependencies

### v3.1.0
- Add `enumerable` flag to exclude instance properties from enumeration ([#724](../../issues/724))

### v3.0.0
- Rename `cache` -> `identityCache` and **disable by default** ([#350](../../issues/350), [#564](../../issues/564), [#626](../../issues/626), [#672](../../issues/672), [#684](../../issues/684), [#694](../../issues/694), [#721](../../issues/721))

**This is a potentially breaking change:**
```js
User.get(14, (err, userA) =>
  User.get(14, (err, userB) =>
    // v2
    userA    == userB
    userA.id == userB.id
    // v3, identity cache is now disabled by default
    userA    != userB
    userA.id == userB.id
  )
)
```

### v2.1.29
- Fix hasOne association when ID is 0 ([#681](../../issues/681))
- Fix global var leak ([#682](../../issues/682))

### v2.1.28
- Ensure hasMany associations work when properties have mapsTo ([#679](../../issues/679))

### v2.1.27
- Fix noisy mysql debug output ([#642](../../issues/642))

### v2.1.26
- Add `instance.saveAssociationsByDefault` setting
- Bump node-sql-query version to v0.1.26

### v2.1.25
- Fix `pool` and `debug` query options boolean check ([#638](../../issues/638))
- Add `hasOne(field: 'userId', mapsTo: 'user_id')` option ([#638](../../issues/638))

### v2.1.24
- Bump dependencies; Allow left/right joins in underlying db.driver.query

### v2.1.23
- Green tests on io.js & node 0.12 ([#618](../../issues/618))
- Don't crash on null dates if timezone is set ([#618](../../issues/618))
- Fix wrong error when module is missing ([#593](../../issues/593))
- Fix key field when using `mapsTo` and cache ([#580](../../issues/580))

### v2.1.22
- Fix ignorecase unique scope for hasOne property ([#603](../../issues/603))

### v2.1.21
- Fix mixed case uniqueness constraint on postgres ([#597](../../issues/597))
- Fix mongo adapter association delete ([#543](../../issues/543))
- Fix mongo ne/eq comparators for _id key ([#586](../../issues/586))

### v2.1.20 - 19 Nov 2014
- Exposing dirty properties array on the instance ([#575](../../issues/575))
- Bump node-enforce version ([#562](../../issues/562))

### v2.1.19 - 21 Aug 2014
- Fix Chain.find().remove() & Chain.find.count() with mapsTo keys ([#530](../../issues/530))
- Add not_like comparator

### v2.1.18 - 29 Jul 2014
- Add `alwaysValidate` flag ([#540](../../issues/540), [#352](../../issues/352))
- Fix mongo hasMany wrong instance bug ([#479](../../issues/479))
- Fix mysql index bug (dresende/node-sql-ddl-sync[#19](../../issues/19))

### v2.1.17 - 24 Jul 2014
- Fix postgres & sqlite driver conversion of floats and ints.

### v2.1.16 - 15 Jul 2014
- Fix Model.create missing properties bug
- Add missing `var` ([#523](../../issues/523))
- Fix hasOne `required: true` when `instance.returnAllErrors` is true.
  This also makes hasOne required validations messages consistent with other validation messages.

### v2.1.15 - 05 Jun 2014
- Feature: Enable plugging in custom third-party drivers (now known as adapters) ([#512](../../issues/512))
- Add Instance.set() so that properties of type object can have their properties set and mark model as dirty ([#517](../../issues/517))
- Add Instance.markAsDirty(propName) to force a properties state to dirty/changed.
- Enable Property.mapsTo for keys ([#509](../../issues/509))
- Fix hasMany join tables with custom key columns ([#510](../../issues/510))

### v2.1.14 - 22 May 2014
- Allow explicitly specifying `key: true` on properties rather than passing in an array of ids.
- Fix Property.mapsTo ([#506](../../issues/506))

### v2.1.13 - 21 May 2014
- Dont modify array passed to execQuery

### v2.1.12 - 20 May 2014
- Add custom-type support to hasMany extra properties.
- Fix SQLite index name collisions ([#499](../../issues/499))

### v2.1.11 - 19 May 2014
- Fix hasMany.getAccessor().count()

### v2.1.10 - 09 May 2014
- Fix sqlite Dialect.clear - resets incremental counters ([#497](../../issues/497))

### v2.1.9 - 06 May 2014
- Add basic PostGIS support - ([#456](../../issues/456), [#375](../../issues/375))
- Allow mapping model properties to differently named columns ([#273](../../issues/273), [#495](../../issues/495))

### v2.1.8 - 28 Apr 2014
- Fix '.omit' ([#491](../../issues/491))

### v2.1.7 - 25 Apr 2014
- Add explicit 'integer' type to avoid confusion.
  `type: 'number', rational: false` will auto convert to `type: 'integer'`.

### v2.1.6 - 23 Apr 2014
- Add '.omit' to chain find - opposite of '.only'

### v2.1.5 - 08 Apr 2014
- Don't create indexes for primary/composite keys; they are created automatically ([#484](../../issues/484))

### v2.1.4 - 19 Mar 2014
- Fix TypeScript module declaration ([#362](../../issues/362))
- Fixes reversed hasOne.getAccessor when called without callback ([#267](../../issues/267))
- Fixes default pool value ([#366](../../issues/366))
- Fixes erroneous misformatting of top-level $and/$or clauses ([#365](../../issues/365))
- Fix and improve TypeScript declaration ([#369](../../issues/369))
- Use local as default timezone, pass timezone option to Query ([#325](../../issues/325))
- Postgres: always save object as Buffer ([#378](../../issues/378))
- Postgres: fix queries for prop create index, and for primary keys ([#377](../../issues/377))
- Typo in property definition ([#382](../../issues/382))
- Implement eager loading - huge performance win ([#393](../../issues/393))
- Make model methods defined by `defineProperty` writable so they can be mocked ([#399](../../issues/399))
- Allow composite keys when calling remove. ([#345](../../issues/345), [#358](../../issues/358))
- Fixed bug on like expression using MongoDB ([#403](../../issues/403))
- Fixes pool and debug settings always true ([#405](../../issues/405))
- Update express middleware for express.io ([#413](../../issues/413))
- Allow HasMany.setAccessor to take an empty array
- Fix DML if object value is null, JSON.stringify return string 'null' ([#380](../../issues/380))
- Correct sqlite log statement ([#452](../../issues/452))
- Make association methods writable so they can be mocked ([#451](../../issues/451))
- Throw ORM errors rather than generic ones ([#455](../../issues/455))
- Fix sqlite3 driver with config object on windows ([#461](../../issues/461))
- Fix 'No associations defined' error ([#398](../../issues/398))
- Don't modify connection object ([#469](../../issues/469))
- Don't fire afterSave hooks when calling save with no changes ([#457](../../issues/457))
- Fix reverse has one association findBy* ([#450](../../issues/450))
- Auto cast hasMany extra properties with types like 'Object' ([#466](../../issues/466))
- Add example full featured express app - AnonTXT

### v2.1.3 - 14 Oct 2013

- Fixes connection strings being parsed by url module to don't forget about port :) ([#355](../../issues/355))
- Fixes tests common.getConnectionString to use common.getConfig
- Converts indentation from spaces:2 to tabs
- Removes unnecessary path requirement in ORM.js
- Changes user methods to be writeable property instances (fixes [#296](../../issues/296))
- Fixes afterAutoFetch next(err) bubling up just like afterLoad ([#301](../../issues/301))
- Fixes cache for hasOne associations ([#339](../../issues/339))
- Adds findByAssociation to extendsTo ([#314](../../issues/314))
- Fixes Model.extendsTo autoFetch not working (throwing) ([#323](../../issues/323))
- Adds hasMany hooks.beforeSave ([#324](../../issues/324))

### v2.1.2 - 16 Sep 2013

- Fixes stack overflow on instance.save() with a reversed hasOne association ([#338](../../issues/338))
- Reverts should dev dependency to 1.2.2 (newer version was causing problems)
- When using postgres you can now use pg@2.6.2 (unless when connecting to Heroku - use 2.5.0)

### v2.1.1 - 13 Sep 2013

- Add TypeScript interface
- Allow custom join tables ([#276](../../issues/276))
- Fixes stack overflow when saving auto-fetched model with relations ([#279](../../issues/279))
- Unique validator can be scoped and case insensitive ([#288](../../issues/288))
- Allow async express middleware ([#291](../../issues/291))
- Allow finding by associations ([#293](../../issues/293))
- Fix sqlite find with boolean ([#292](../../issues/292))
- Fix `afterLoad` hook error handling ([#301](../../issues/301))
- Allow auto-escaping for custom queries ([#304](../../issues/304))
- Add support for custom property types ([#305](../../issues/305))
- Allow ordering by raw sql - .orderRaw() when chaining ([#308](../../issues/308), [#311](../../issues/311))
- Fix saving Instance.extra fields ([#312](../../issues/312))
- Fix `NaN` handling ([#310](../../issues/310))
- Fix incorrect SQL query ([#313](../../issues/313))
- Deprecated `PARAM_MISSMATCH` ErrorCode in favour of correctly spelt `PARAM_MISMATCH` ([#315](../../issues/315))
- Add promises to query chain ([#316](../../issues/316))
- Adds a test for hasMany.delAccessor with arguments switched ([#320](../../issues/320))
- Allow passing timezone in database connection string, local timezone is now default ([#325](../../issues/325), [#303](../../issues/303))
- Adds ability to call db.load() with multiple files (closes [#329](../../issues/329))
- For mysql driver, when using pool, use con.release() instead of con.end() (if defined) (closes [#335](../../issues/335))
- Passes error from afterLoad hook to ready event
- Most errors now have a model property
- Adds connection.pool and connection.debug settings
- Fixes throw when calling ChainFind.first() or .last() and it has an error
- Removes upper limit on VARCHAR column size
- Allows multi-key models to support hasMany

### v2.1.0 - 3 Aug 2013

- Adds License (MIT) file (closes [#271](../../issues/271))
- Make Model.get respect Model autoFetch default value ([#277](../../issues/277))
- Changes the way ":" is added to sqlite db paths ([#270](../../issues/270))
- Fixes duplicated debug lines for postgres ([#258](../../issues/258))
- Fixes not saving associations if no changes (other than associations) are made ([#256](../../issues/256))
- Fixes autoFetch being discarded in Model.get options (closes [#266](../../issues/266))
- Adds beforeDefine to plugins ([#263](../../issues/263))
- Allows user to pass an object to extendsTo.setAccessor instead of an instance (detected via [#250](../../issues/250))
- Changes autoFetch to avoid autofetching if instance is not saved (it's new!) ([#242](../../issues/242))
- Changes validations and predefined validators to use enforce@0.1.1
- Adds support for setting properties.association_key to be a function (name, field)
- Passes connection settings to database drivers
- Creates initial mongodb driver and 'mongo' driver alias
- Allow querying chainfind with sql conditions
- Allow passing extra options to extended models
- Allow big text fields
- Allow before* hooks to modify the instance
- Fixes [#226](../../issues/226) - hasOne delAccessor not working
- Adds Utilities.getRealPath to look for the real path to load based on the file where it was called from (for db.load and db.use)
- Fixes Model.aggregate().call() to accept no arguments except function name
- Fix problem with extendsTo and custom key types
- Better association typing and multikey support

### v2.0.15 - 10 July 2013

- Support for 'point' type as a property ([#221](../../issues/221))
- .call() in aggregates for generic functions ([#204](../../issues/204))
- Adds hook afterAutoFetch triggered after extending and auto fetching (if any) associations ([#219](../../issues/219))
- Adds predefined validator .password()
- Adds ability to have the afterLoad hook blocking ([#219](../../issues/219))
- Changes Model.create() to wait for createInstance callback instead of using the returned value
- Fixes problem with hasOne associations for none persisted instances and autoFetch active just blocking
- Refactored Model.hasOne() constructor to be able to mix parameters
- Fixes reversed hasOne association on the reversed model not being correctly saved ([#216](../../issues/216))
- Changes Model.hasMany.addAccessor to throw just like .setAccessor when no associations are passed
- Adds ability to pass an Array to hasMany.hasAccessor and also not passing any instance to hasAccessor and have it check for any associated item
- Exposes Model methods to change hooks after model definition
- Fixes postgres driver not returning numbers for number columns
- Fixes passing json object instead of instances to Model.create() associations ([#216](../../issues/216))
- Passes Model to Instance directly, changes Instance to use Model.properties instead of opts.properties
- Exposes Model.properties
- Removes old Property.js throw error in favour of new one
- Adds initial Model.extendsTo(name, properties[, opts])
- Avoids redefining properties in instances
- Adds ErrorCodes.NOT_DEFINED
- Adds db.drop() - similar to db.sync()
- Changes hasMany.getAccessor to support order as string (closes [#196](../../issues/196))
- Handle django string formatted sqlite datetime
- Many bug fixes

### v2.0.14 - 27 June 2013

- Changes many errors to use the ErrorCodes generator ([#206](../../issues/206))
- Changes Model.aggregate() to support multiple orders when calling .order() ([#207](../../issues/207))
- Changes Readme.md sqlite3 version and adds warning.
- Fix wrong import of debug output for aggregate functions
- Fix orm when running on node v0.6 (at least) and module not found error has no code property
- Adds model.namePrefix setting ([#203](../../issues/203))
- Fixes bug when passing an array (object) of ids but no options object
- Only mark model as dirty if a property has _really_ changed
- Fix hasOne infinite loop
- WIP: Fix hasOne infinite loop & migrate tests to mocha
- Fixes ipv4 predefined validator match string (it was not matching correctly!)
- Fixes Model.get() when passing cache: false and model has cache: true
- Creates Singleton.clear() to clear cache, exports singleton in orm
- Fix required property model.save only threw a single error with returnAllErrors = true
- Fixes some hasMany association usage of Association.id to check for real id property name ([#197](../../issues/197))
- Changes db.load() to return value from loaded and invoked function ([#194](../../issues/194))
- Adds possibility to add a callback to ChainFind.find() ([#190](../../issues/190))
- Adds .findByX(...) to .hasOne("X", ...)
- Allow db.load() to work outside of module.exports
- Fix mysql driver for non-autoincrement key
- Test framework moving to mocha, not complete yet
- Adds `make cov` to make for a test coverage
- Many other bug fixes

### v2.0.13 - 5 June 2013

- Avoids throwing when calling db.close() without a callback and using pool in mysql (fixes [#180](../../issues/180))
- Adds initial code to support passing associations when creating new instances ([#162](../../issues/162))
- Changes Model.exists() to allow array or object passing
- Allows passing an object instead of an instance as an hasOne asssociation
- Fixes bug introduced in 2.0.12 forcing extra properties being ignored (fixes [#183](../../issues/183))

### v2.0.12 - 30 May 2013

- New plugin: orm-paging
- Adds Model.one() as an alias for Model.all().limit(1) ([#148](../../issues/148))
- Changes Model.one() to return only one instance (or null) instead of an Array ([#148](../../issues/148))
- Allow passing a single object to Model.create() ([#159](../../issues/159))
- Fixes passing unknown properties to new instances (fixes [#178](../../issues/178))
- Adds AggregateFunctions.limit() ([#172](../../issues/172))
- Checks for driver debug flag and prints debug lines in AggregateFunctions ([#171](../../issues/171))
- Added Hook 'beforeValidation' prior to _all_ validations
- Avoids JSON parsing values when they are already objects (and not string buffers) ([#168](../../issues/168))
- Changes beforeRemove, beforeCreate, beforeSave and beforeValidation to use Hooks.wait() (sync or async hooks) ([#167](../../issues/167))
- Support specifying size of number columns
- Many more bug fixes
- More tests added
- Many documentation improvements

### v2.0.11 - 3 May 2013

- Changes orm.connect() to return an EventEmitter
- Avoids saving an instance if a property is null and is marked as required ([#142](../../issues/142))
- Avoids passing property validations if property is null and is not required ([#142](../../issues/142))
- Fixes documentation where user should be used instead of username in connection options (closes [#145](../../issues/145))
- Adds postgresql schema support
- Fixes autoFetchLimit and cascadeRemove options not being used when set to 0 or false (fixes [#144](../../issues/144))

### v2.0.10 - 25 Apr 2013

- Adds ChainFind.where() as a link to ChainFind.find()
- Adds support for -property on ChainFind.order()
- Reduces the size of mysql driver
- Adds initial support for multi primary key models
- Updates DB.define() and Model.get() to support tables with multiple primary keys ([#135](../../issues/135))
- Creates Model.all() as alias to Model.find(), adds simple example
- Fixes autoFetch option not being considered in Model.find() ([#120](../../issues/120))
- Adds support for chaining and rechaining with ChainFind
- Fixes bug about connection config object not having query key (fixes [#130](../../issues/130))
- Adds initial plugin architecture - .use() ([#121](../../issues/121))
- Fixes some bugs
- Adds more tests

### v2.0.9 - 18 Apr 2013

- Correct 'returnAllErrors' setting behaviour
- Adds default settings properties.required = false ([#110](../../issues/110))
- Changes instance.save() to support an hash of changes before saving ([#111](../../issues/111))
- Adds setting connection.reconnect (default=false) to auto-reconnect (only mysql for now) ([#112](../../issues/112))
- Adds possibility of .order() to aggregate method ([#114](../../issues/114))
- Adds .select() aggregate function to support additional properties to be selected ([#114](../../issues/114))
- Adds .as() aggregate function to define alias to previous function ([#123](../../issues/123))
- Adds .distinct() aggregate function to all drivers ([#123](../../issues/123))
- Changes model.find() queries to specify columns instead of selecting * from tables ([#106](../../issues/106))
- Changes hasMany.addAccessor to support arrays of instances ([#97](../../issues/97))
- Adds support for descending ordering using "-property" ([#115](../../issues/115))
- Adds pool support to postgres driver
- Removes postgres axomic driver
- Updates redshift driver to use new postgres driver
- Adds .validate() model to instances
- Adds more tests
- Some documentation updates
- Some bug fixes

### v2.0.8 - 8 Apr 2013

- Adds more aggregate functions to the several drivers
- Adds groupBy to aggregate methods ([#99](../../issues/99))
- Adds possibility to use "-property" to indicate a descending order in Model.find()
- Adds setting instance.returnAllErrors (default: true)
- Changes hasMany.setAccessor to support passing an array of instances ([#97](../../issues/97))
- Fixes property defaultValue not being set if property is null (closes [#104](../../issues/104))
- Adds support for indexes on properties that are no associations ([#98](../../issues/98))
- Adds a new option to add multi-column indexes to models ([#98](../../issues/98))
- Bug fixes

### v2.0.7 - 3 Apr 2013

- Fixed SQLite driver writing to console when it should not
- Changes Express middleware to wait for connections (errored or not) before processing requests ([#92](../../issues/92))
- Avoids loosing previously set limit (if set) on Model.fin() ([#93](../../issues/93))
- Fixes hasMany getAccessor when using an Array as only argument (specific properties)
- Adds ChainFind .last() (similar to .first())
- Fixes hasMany acessor names to correctly convert prop_name to PropName (underscores)
- Adds hasMany hasAcessor conditional to ChainFind ([#94](../../issues/94))

### v2.0.6 - 22 Mar 2013

- Changes orm.connect to check connection url/opts to avoid throwing some errors about missing protocol or database ([#75](../../issues/75))
- Hardens some validators againt null/undefined, changes match validator to avoid compiling regex everytime it's called
- Changes back default instance properties to null instead of undefined
- Changes Express middleware to be able to have more than one connection ([#76](../../issues/76))
- Changes Singleton to avoid cache if save_check option is enabled and cached instance is not saved ([#78](../../issues/78))
- Adds Model.aggregate()
- Adds 'required' option to hasOne associations
- Changes singleton uid creation to use driver uid ([#86](../../issues/86))
- Changes Model.drop and Model.sync to be resistive to no callback
- Changes ORM.sync() to also be resistant to no callback
- Many bug fixes

### v2.0.5 - 13 Mar 2013

- Uses sql-query for SQL query building
- Adds initial middleware for Express
- Moves beforeCreate to near beforeSave so people can change instance just like beforeSave ([#69](../../issues/69))
- Fixes bug when creating Models without all data ([#69](../../issues/69))
- Changes drivers.count() to be able to pass options (related to [#68](../../issues/68))
- Changes postgres DDL to create ENUM types before table ([#71](../../issues/71))
- Changes hasOne.getAccessor to be able to fetch instance before association (if needed)
- Adds support for Object property type in DDL drivers ([#72](../../issues/72))

### v2.0.4 - 7 Mar 2013

- Changes db.load() to behave like builtin require()
- Moves hook beforeSave to before checking validations ([#66](../../issues/66))
- Changes postgres driver to support ssl flag and pass it to pg driver
- Adds possibility to add order to hasMany getAccessor ([#58](../../issues/58))
- Fixes hasOne reversed associations not having setAccessor
- Adds db.ping() ([#57](../../issues/57))
- Changes db.load to avoid throwing and just create the error
- Added "afterRemove" hook
- Added "afterCreate" hook
- Support Model.find({ prop: null }) (closes [#59](../../issues/59))
- Adds LIKE operator
- Many bug fixes

### v2.0.3 - 26 Feb 2013

- Fixes postgresql integer columns ([#52](../../issues/52))
- Adds boolean support for sqlite ([#50](../../issues/50))
- Fixes an issue where hasMany association properties were not being checked ([#49](../../issues/49))
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

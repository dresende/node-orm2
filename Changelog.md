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

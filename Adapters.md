# Creating database adapters for orm2

To add a database adapter to `orm`, call its `addAdapter` method:
 
```js
require('orm2').addAdapter('cassandra', CassandraAdapter);
```

The first argument is the alias to register for connection URLs. For example, the above will allow you to do this:
 
```js
var orm = require('orm2');
orm.connect('cassandra://username:password@localhost/test', function (err, db) { });
```

The second argument is the constructor for your adapter object.

## Defining adapters

Your adapter should provide the following members. 

### Constructor(config, connection, opts)

The adapter object constructor should have three parameters:
 
* config - optional configuration for the database connection. It contains the following properties:
    * timezone - optional timezone
    * href - URL to use for connecting to the database if the connection argument is null
    * host - The hostname of `href`
    * pathname - The `path` of `href`
    * ssl - Boolean indicating whether the adapter should use SSL when connecting to the database
    * query - Optional configuration for how the adapter should perform queries
        * ssl - Boolean indicating whether queries should be sent using SSL
        * strdates - Boolean indicating whether strings should be used for dates 
* connection - optionally passed if reusing an existing connection
* opts - optional options configuring the adapter's behavior. It contains the following properties:
    * pool - A boolean indicating whether the adapter should use connection pooling
    * debug - If true, whether the adapter should operate in debug mode
    * settings - A key/value object store. Use `get(key)` and `set(key, value)` methods to manipulate the settings. The
      following settings are defined:
        * properties.primary_key - The column/field name to use for object primary keys
        * properties.association_key - A function taking a `name` and `field` parameter that returns the name of the
          column that establishes the association

### isSql property

This should be set to `true` if your database is a SQL database.

### customTypes property

Your adapter should have a `customTypes` object, with the property names being the names of the custom types, and each 
value being the options relating to the type.

### connect(cb) method (required)

Establishes your database connection.

### reconnect(cb, connection) method (optional)

Establishes/re-establishes a connection. The optional prior connection is passed in the `connection` parameter. 

### ping(cb) method (required)

Tests whether your connection is still alive.

### close(cb) method (required)

Closes your database connection.

### propertyToValue(value, property) method (required)

Maps an object property to the correlated value to use for the database. 

### valueToProperty(value, property) method (required)

Maps a database value to the property value to use for the mapped object. 

### find(fields, table, conditions, opts, cb) method (required)

Implement this to select and return data stored in the database. 
See the [documentation for Model.find](./README.md#modelfind-conditions---options---limit---order---cb-).

### insert(table, data, id_prop, cb) method (required)

Inserts an object into a database table.

### update(table, changes, conditions, cb) method (required)

Updates an object in the appropriate database row.

### remove(table, conditions, cb) method (required)

Implement this to support the removal of an object from a table.

### count(table, conditions, opts, cb) method (required)

Implement this to support [Model.count](./README.md#modelcount-conditions--cb).

### clear(table, cb) method (required)

Implement this to support `Model.clear`, which deletes all objects from a given table.

### eagerQuery(association, opts, ids, cb) method (required)

Implement this to support eager loading of associated objects.

### query property (optional)

For SQL databases, the `Query` object from the `sql-query` package used to generate ad-hoc queries.

### getQuery() method (optional)

For SQL databases, returns a `Query` object from the `sql-query` package.

### execQuery(query, cb) method (optional)

For SQL databases, this executes a `Query` object from the `sql-query` package.

### aggregate_functions[] property (optional)

If your adapter supports SQL aggregate functions, this should be an array of supported function names.

### hasMany(Model, association) method (optional)

If your adapter maintains associations in a unique (non-SQL-like) manner, return an object from this method to implement
a one-to-many association. The return value should have the following methods:
 
* has(Instance, Associations, conditions, cb) - tests if the associations have any objects matching the conditions
* get(Instance, conditions, options, createInstance, cb) - retrieves associated objects
* add(Instance, Association, data, cb) - inserts an associated object
* del(Instance, Associations, cb) - deletes an object from a set of associations

### sync(opts, cb) method (optional)

If your adapter supports creating a table from a model, implement this method. The following options are passed:

* extension
* id
* table
* properties
* allProperties
* indexes
* customTypes
* one_associations
* many_associations
* extend_associations
 
### drop(opts, cb) method (optional)

If your adapter supports dropping a table, implement this method. The following options are passed to this method:

* table - The name of the table
* properties
* one_associations
* many_associations

### on(event, cb) method (required)

Your adapter should be an `EventEmitter`, and should emit the `error` event when applicable.

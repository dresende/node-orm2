## Object Relational Mapping

[![Build Status](https://secure.travis-ci.org/dresende/node-orm2.png?branch=master)](http://travis-ci.org/dresende/node-orm2)
[![](https://badge.fury.io/js/orm.png)](https://npmjs.org/package/orm)
[![](https://gemnasium.com/dresende/node-orm2.png)](https://gemnasium.com/dresende/node-orm2)

## Install

```sh
npm install orm
```

## Node.js Version Support

Tests are done using [Travis CI](https://travis-ci.org/) for node versions 0.4.x, 0.6.x, 0.8.x and 0.10.x. If you want you can run
tests locally.

```sh
make
```

## DBMS Support

- MySQL
- PostgreSQL
- Amazon Redshift
- SQLite

## Features

- Create Models, sync, drop, bulk create, get, find, remove, count, aggregated functions
- Create Model associations, find, check, create and remove
- Define custom validations (several builtin validations, check instance properties before saving)
- Model instance caching and integrity (table rows fetched twice are the same object, changes to one change all)
- Plugins: [MySQL FTS](http://dresende.github.io/node-orm-mysql-fts) , [Pagination](http://dresende.github.io/node-orm-paging) , [Transaction](http://dresende.github.io/node-orm-transaction)

## Introduction

This is a node.js object relational mapping module.

An example:

```js
var orm = require("orm");

orm.connect("mysql://username:password@host/database", function (err, db) {
  if (err) throw err;

	var Person = db.define("person", {
		name      : String,
		surname   : String,
		age       : Number,
		male      : Boolean,
		continent : [ "Europe", "America", "Asia", "Africa", "Australia", "Antartica" ], // ENUM type
		photo     : Buffer, // BLOB/BINARY
		data      : Object // JSON encoded
	}, {
		methods: {
			fullName: function () {
				return this.name + ' ' + this.surname;
			}
		},
		validations: {
			age: orm.validators.rangeNumber(18, undefined, "under-age")
		}
	});

	Person.find({ surname: "Doe" }, function (err, people) {
		// SQL: "SELECT * FROM person WHERE surname = 'Doe'"

		console.log("People found: %d", people.length);
		console.log("First person: %s, age %d", people[0].fullName(), people[0].age);

		people[0].age = 16;
		people[0].save(function (err) {
			// err.msg = "under-age";
		});
	});
});
```

## Express

If you're using Express, you might want to use the simple middleware to integrate more easily.

```js
var express = require('express');
var orm = require('orm');
var app = express();

app.use(orm.express("mysql://username:password@host/database", {
	define: function (db, models) {
		models.person = db.define("person", { ... });
	}
}));
app.listen(80);

app.get("/", function (req, res) {
	// req.models is a reference to models used above in define()
	req.models.person.find(...);
});
```

You can call `orm.express` more than once to have multiple database connections. Models defined across connections
will be joined together in `req.models`. **Don't forget to use it before `app.use(app.router)`, preferably right after your
assets public folder(s).**

## Settings

Settings are used to store key value pairs. A settings object is stored on the global orm object and on each database connection.

```js
var orm = require("orm");

orm.settings.set("some.deep.value", 123);

orm.connect("....", function (err, db) {
	// db.settings is a snapshot of the settings at the moment
	// of orm.connect(). changes to it don't affect orm.settings

	console.log(db.settings.get("some.deep.value")); // 123
	console.log(db.settings.get("some.deep"));       // { value: 123 }
});
```

## Connecting

First, add the correct driver to your `package.json`:

 driver                | dependency
:----------------------|:---------------------------
 mysql                 | `"mysql" : "2.0.0-alpha7"`
 postgres<br/>redshift | `"pg": "~1.0.0"`
 sqlite                | `"sqlite3" : "2.1.7"`

These are the versions tested. Use others (older or newer) at your own risk.

### Options

You can pass in connection options either as a string:

```js
var orm = require("orm");

orm.connect("mysql://username:password@host/database?pool=true", function (err, db) {
	// ...
});
```

**Note:** `pool` is only supported by mysql & postgres. When 'pool' is set to true, your database connections are cached so that connections can be reused, optimizing performance.

**Note:** `strdates` is only supported by sqlite. When true, date fields are saved as strings, compatible with django

Or as an object:

```js
var opts = {
  database : "dbname",
  protocol : "[mysql|postgres|redshift|sqlite]",
  host     : "127.0.0.1",
  port     : 3306,         // optional, defaults to database default
  user     : "..",
  password : "..",
  query    : {
    pool     : true|false,   // optional, false by default
    debug    : true|false,   // optional, false by default
    strdates : true|false    // optional, false by default
  }
};
orm.connect(opts, function (err, db) {
	// ...
});
```

You can also avoid passing a callback and just listen for the connect event:

```js
var orm = require("orm");
var db  = orm.connect("mysql://username:password@host/database");

db.on("connect", function (err, db) {
	// ...
});
```

## Models

A Model is an abstraction over one or more database tables. Models support associations (more below). The name of the model is assumed to match the table name.

Models support behaviours for accessing and manipulating table data.

## Defining Models

Call `define` on the database connection to setup a model. The name of the table and model is used as an identifier for the model on the database connection, so you can easily access the model later using the connection.

```js
var Person = db.define('person', {        // 'person' will be the table in the database as well as the model id
	// properties
	name    : String,                     // you can use native objects to define the property type
	surname : { type: "text", size: 50 }  // or you can be specific and define aditional options
}, {
	// options (optional)
});
```

### Properties

#### Types


 Native   | String     | Native   | String
 :--------|:-----------|:---------|:---------
 String   | 'text'     | Date     | 'date '
 Number   | 'number'   | Object   | 'object'
 Boolean  | 'boolean'  | Buffer   | 'binary'
          |            |  ---     | 'enum'

#### Options

##### [all types]
* `required`: true marks the column as `NOT NULL`, false (default)
* `defaultValue`: sets the default value for the field

##### string
* `size`: max length of the string

##### number
* `rational`: true (default) creates a FLOAT/REAL, false an INTEGER
* `size`: byte size of number, default is 4. Note that 8 byte numbers [have limitations](http://stackoverflow.com/questions/307179/what-is-javascripts-max-int-whats-the-highest-integer-value-a-number-can-go-t)
* `unsigned`: true to make INTEGER unsigned, default is false

##### date
* `time`: true (default) creates a DATETIME/TIMESTAMP, false a DATE

Note that these may vary accross drivers.

### Instance Methods

Are passed in during model definition.

```js
var Person = db.define('person', {
    name    : String,
    surname : String
}, {
    methods: {
        fullName: function () {
            return this.name + ' ' + this.surname;
        }
    }
});

Person.get(4, function(err, person) {
    console.log( person.fullName() );
})
```

### Model Methods

Are defined directly on the model.

```js
var Person = db.define('person', {
    name    : String,
    height  : { type: 'number', rational: false }
});
Person.tallerThan = function(height, callback) {
    this.find({ height: orm.gt(height) }, callback);
};

Person.tallerThan( 192, function(err, tallPeople) { ... } );
```


## Loading Models

Models can be in separate modules. Simply ensure that the module holding the models uses module.exports to publish a function that accepts the database connection, then load your models however you like.

Note - using this technique you can have cascading loads.

```js
// your main file (after connecting)
db.load("./models", function (err) {
    // loaded!
    var Person = db.models.person;
    var Pet    = db.models.pet;
});

// models.js
module.exports = function (db, cb) {
    db.load("./models-extra", function (err) {
        if (err) {
            return cb(err);
        }

        db.define('person', {
            name : String
        });

        return cb();
    });
};

// models-extra.js
module.exports = function (db, cb) {
    db.define('pet', {
        name : String
    });

    return cb();
};
```

## Synchronizing Models

Models can create their underlying tables in the database. You may call Model.sync() on each Model to create the underlying table or you can call db.sync() at a connection level to create all tables for all models.

```js
// db.sync() can also be used
Person.sync(function (err) {
	!err && console.log("done!");
});
```

## Dropping Models

If you want to drop a Model and remove all tables you can use the `.drop()` method.

```js
Person.drop(function (err) {
	!err && console.log("person model no longer exists!");
});
```

## Advanced Options

ORM2 allows you some advanced tweaks on your Model definitions. You can configure these via settings or in the call to `define` when you setup the Model.

For example, each Model instance has a unique ID in the database. This table column is
by default "id" but you can change it.

```js
var Person = db.define("person", {
	name : String
}, {
	id   : "person_id"
});

// or just do it globally..
db.settings.set("properties.primary_key", "UID");

// ..and then define your Models
var Pet = db.define("pet", {
	name : String
});
```

**Pet** model will have 2 columns, an `UID` and a `name`.

Other options:

- `cache` : (default: `true`) Set it to `false` to disable Instance cache ([Singletons](#singleton)) or set a timeout value (in seconds);
- `autoSave` : (default: `false`) Set it to `true` to save an Instance right after changing any property;
- `autoFetch` : (default: `false`) Set it to `true` to fetch associations when fetching an instance from the database;
- `autoFetchLimit` : (default: `1`) If `autoFetch` is enabled this defines how many hoops (associations of associations)
  you want it to automatically fetch.

## Hooks

If you want to listen for a type of event than occurs in instances of a Model, you can attach a function that
will be called when that event happens.

Currently the following events are supported:

- `afterLoad` : (no parameters) Right after loading and preparing an instance to be used;
- `afterAutoFetch` : (no parameters) Right after auto-fetching associations (if any), it will trigger regardless of having associations or not;
- `beforeSave` : (no parameters) Right before trying to save;
- `afterSave` : (bool success) Right after saving;
- `beforeCreate` : (no parameters) Right before trying to save a new instance (prior to `beforeSave`);
- `afterCreate` : (bool success) Right after saving a new instance;
- `beforeRemove` : (no parameters) Right before trying to remove an instance;
- `afterRemove` : (bool success) Right after removing an instance;
- `beforeValidation` : (no parameters) Before all validations and prior to `beforeCreate` and `beforeSave`;

All hook function are called with `this` as the instance so you can access anything you want related to it.

For all `before*` hooks, you can add an additional parameter to the hook function. This parameter will be a function that
must be called to tell if the hook allows the execution to continue or to break. You might be familiar with this workflow
already from Express. Here's an example:

```js
var Person = db.define("person", {
	name    : String,
	surname : String
}, {
	hooks: {
		beforeCreate: function (next) {
			if (this.surname == "Doe") {
				return next(new Error("No Does allowed"));
			}
			return next();
		}
	}
});
```

This workflow allows you to make asynchronous work before calling `next`.

## Finding Items

### Model.get(id, [ options ], cb)

To get a specific element from the database use `Model.get`.

```js
Person.get(123, function (err, person) {
	// finds person with id = 123
});
```

### Model.find([ conditions ] [, options ] [, limit ] [, order ] [, cb ])

Finding one or more elements has more options, each one can be given in no specific parameter order. Only `options` has to be after `conditions` (even if it's an empty object).

```js
Person.find({ name: "John", surname: "Doe" }, 3, function (err, people) {
	// finds people with name='John' AND surname='Doe' and returns the first 3
});
```

If you need to sort the results because you're limiting or just because you want them sorted do:

```js
Person.find({ surname: "Doe" }, "name", function (err, people) {
	// finds people with surname='Doe' and returns sorted by name ascending
});
Person.find({ surname: "Doe" }, [ "name", "Z" ], function (err, people) {
	// finds people with surname='Doe' and returns sorted by name descending
	// ('Z' means DESC; 'A' means ASC - default)
});
```

There are more options that you can pass to find something. These options are passed in a second object:

```js
Person.find({ surname: "Doe" }, { offset: 2 }, function (err, people) {
	// finds people with surname='Doe', skips the first 2 and returns the others
});
```

### Model.count([ conditions, ] cb)

If you just want to count the number of items that match a condition you can just use `.count()` instead of finding all
of them and counting. This will actually tell the database server to do a count (it won't be done in the node process itself).

```js
Person.count({ surname: "Doe" }, function (err, count) {
	console.log("We have %d Does in our db", count);
});
```

### Model.exists([ conditions, ] cb)

Similar to `.count()`, this method just checks if the count is greater than zero or not.

```js
Person.exists({ surname: "Doe" }, function (err, exists) {
	console.log("We %s Does in our db", exists ? "have" : "don't have");
});
```

### Aggregating Functions

If you need to get some aggregated values from a Model, you can use `Model.aggregate()`. Here's an example to better
illustrate:

```js
Person.aggregate({ surname: "Doe" }).min("age").max("age").get(function (err, min, max) {
	console.log("The youngest Doe guy has %d years, while the oldest is %d", min, max);
});
```

An `Array` of properties can be passed to select only a few properties. An `Object` is also accepted to define conditions.

Here's an example to illustrate how to use `.groupBy()`:

```js
//The same as "select avg(weight), age from person where country='someCountry' group by age;"
Person.aggregate(["age"], { country: "someCountry" }).avg("weight").groupBy("age").get(function (err, stats) {
    // stats is an Array, each item should have 'age' and 'avg_weight'
});
```

### Base `.aggregate()` methods

- `.limit()`: you can pass a number as a limit, or two numbers as offset and limit respectively
- `.order()`: same as `Model.find().order()`

### Additional `.aggregate()` methods

- `min`
- `max`
- `avg`
- `sum`
- `count` (there's a shortcut to this - `Model.count`)

There are more aggregate functions depending on the driver (Math functions for example).

#### Chaining

If you prefer less complicated syntax you can chain `.find()` by not giving a callback parameter.

```js
Person.find({ surname: "Doe" }).limit(3).offset(2).only("name", "surname").run(function (err, people) {
    // finds people with surname='Doe', skips first 2 and limits to 3 elements,
    // returning only 'name' and 'surname' properties
});
```

You can also chain and just get the count in the end. In this case, offset, limit and order are ignored.

```js
Person.find({ surname: "Doe" }).count(function (err, people) {
    // people = number of people with surname="Doe"
});
```

Also available is the option to remove the selected items.

```js
Person.find({ surname: "Doe" }).remove(function (err) {
    // Does gone..
});
```

You can also make modifications to your instances using common Array traversal methods and save everything
in the end.

```js
Person.find({ surname: "Doe" }).each(function (person) {
	person.surname = "Dean";
}).save(function (err) {
	// done!
});

Person.find({ surname: "Doe" }).each().filter(function (person) {
	return person.age >= 18;
}).sort(function (person1, person2) {
	return person1.age < person2.age;
}).get(function (people) {
	// get all people with at least 18 years, sorted by age
});
```

Of course you could do this directly on `.find()`, but for some more complicated tasks this can be very usefull.

`Model.find()` does not return an Array so you can't just chain directly. To start chaining you have to call
`.each()` (with an optional callback if you want to traverse the list). You can then use the common functions
`.filter()`, `.sort()` and `.forEach()` more than once.

In the end (or during the process..) you can call:
- `.count()` if you just want to know how many items there are;
- `.get()` to retrieve the list;
- `.save()` to save all item changes.

#### Conditions

Conditions are defined as an object where every key is a property (table column). All keys are supposed
to be concatenated by the logical `AND`. Values are considered to match exactly, unless you're passing
an `Array`. In this case it is considered a list to compare the property with.

```js
{ col1: 123, col2: "foo" } // `col1` = 123 AND `col2` = 'foo'
{ col1: [ 1, 3, 5 ] } // `col1` IN (1, 3, 5)
```

If you need other comparisons, you have to use a special object created by some helper functions. Here are
a few examples to describe it:

```js
{ col1: orm.eq(123) } // `col1` = 123 (default)
{ col1: orm.ne(123) } // `col1` <> 123
{ col1: orm.gt(123) } // `col1` > 123
{ col1: orm.gte(123) } // `col1` >= 123
{ col1: orm.lt(123) } // `col1` < 123
{ col1: orm.lte(123) } // `col1` <= 123
{ col1: orm.between(123, 456) } // `col1` BETWEEN 123 AND 456
{ col1: orm.like(12 + "%") } // `col1` like '12%'
```

### Caching & Integrity

Model instances are cached. If multiple different queries will result in the same result, you will
get the same object. If you have other systems that can change your database (or you're developing and need
to make some manual changes) you should remove this feature by disabling cache. This can be done when you're
defining the Model.

```js
var Person = db.define('person', {
	name    : String
}, {
	cache   : false
});
```

and also globally:

```js
orm.connect('...', function(err, db) {
  db.settings.set('instance.cache', false);
});
```

The cache can be configured to expire after a period of time by passing in a number instead of a
boolean. The number will be considered the cache timeout in seconds (you can use floating point).

**Note**: One exception about Caching is that it won't be used if an instance is not saved. For example, if
you fetch a Person and then change it, while it doesn't get saved it won't be passed from Cache.

## Creating Items

### Model.create(items, cb)

To insert new elements to the database use `Model.create`.

```js
Person.create([
	{
		name: "John",
		surname: "Doe",
		age: 25,
		male: true
	},
	{
		name: "Liza",
		surname: "Kollan",
		age: 19,
		male: false
	}
], function (err, items) {
	// err - description of the error or null
	// items - array of inserted items
});
```

## Updating Items

Every item returned has the properties that were defined to the Model and also a couple of methods you can
use to change each item.

```js
Person.get(1, function (err, John) {
	John.name = "Joe";
	John.surname = "Doe";
	John.save(function (err) {
		console.log("saved!");
	});
});
```

Updating and then saving an instance can be done in a single call:

```js
Person.get(1, function (err, John) {
	John.save({ name: "Joe", surname: "Doe" }, function (err) {
		console.log("saved!");
	});
});
```

If you want to remove an instance, just do:

```js
// you could do this without even fetching it, look at Chaining section above
Person.get(1, function (err, John) {
	John.remove(function (err) {
		console.log("removed!");
	});
});
```

## Validations

You can define validations for every property of a Model. You can have one or more validations for each property.
You can also use the predefined validations or create your own.

```js
var Person = db.define("person", {
	name : String,
	age  : Number
}, {
	validations : {
		name : orm.validators.rangeLength(1, undefined, "missing"), // "missing" is a name given to this validation, instead of default
		age  : [ orm.validators.rangeNumber(0, 10), orm.validators.insideList([ 1, 3, 5, 7, 9 ]) ]
	}
});
```

The code above defines that the `name` length must be between 1 and undefined (undefined means any) and `age`
must be a number between 0 and 10 (inclusive) but also one of the listed values. The example might not make sense
but you get the point.

When saving an item, if it fails to validate any of the defined validations you'll get an `error` object with the property
name and validation error description. This description should help you identify what happened.

```js
var John = new Person({
	name : "",
	age : 20
});
John.save(function (err) {
	// err.field = "name" , err.value = "" , err.msg = "missing"
});
```

The validation stops after the first validation error. If you want it to validate every property and return all validation
errors, you can change this behavior on global or local settings:

```js
var orm = require("orm");

orm.settings.set("instance.returnAllErrors", true); // global or..

orm.connect("....", function (err, db) {
	db.settings.set("instance.returnAllErrors", true); // .. local

	// ...

	var John = new Person({
		name : "",
		age : 15
	});
	John.save(function (err) {
		assert(Array.isArray(err));
		// err[0].field = "name" , err[0].value = "" , err[0].msg = "missing"
		// err[1].field = "age"  , err[1].value = 15 , err[1].msg = "out-of-range-number"
		// err[2].field = "age"  , err[2].value = 15 , err[2].msg = "outside-list"
	});
});
```

### Predefined Validations

Predefined validations accept an optional last parameter `msg` that is the `Error.msg` if it's triggered.

#### `required(msg)`

Ensures property is not `null` or `undefined`. It does not trigger any error if property is `0` or empty string.

#### `rangeNumber(min, max, msg)`

Ensures a property is a number between `min` and `max`. Any of the parameters can be passed as `undefined`
to exclude a minimum or maximum value.

#### `rangeLength(min, max, msg)`

Same as previous validator but for property length (strings).

#### `insideList(list, msg)`

Ensures a property value is inside a list of values.

#### `outsideList(list, msg)`

Ensures a property value is not inside a list of values.

#### `equalToProperty(property, msg)`

Ensures a property value is not the same as another property value in the instance. This validator is good for example for
password and password repetition check.

#### `notEmptyString(msg)`

This is an alias for `rangeLength(1, undefined, 'empty-string')`.

#### `unique(msg)`

Ensures there's not another instance in your database already with that property value. This validator is good for example for
unique identifiers.

#### `password([ checks, ]msg)`

Ensures the property value has some defined types of characters, usually wanted in a password. `checks` is optional and
defaults to `"luns6"` which leans `l`owercase letters, `u`ppercase letters, `n`umbers, `s`pecial characters, with a minimum
length of `6`.

#### `patterns.match(pattern, modifiers, msg)`

Ensures the property value passes the regular expression pattern (and regex modifiers).

The next `patterns.*` are comodity alias to this one.

#### `patterns.hexString(msg)`

Ensures the property value is an hexadecimal string (uppercase or lowercase).

#### `patterns.email(msg)`

Ensures the property value is a valid e-mail (more or less).

#### `patterns.ipv4(msg)`

Ensures the property value is a valid IPv4 address. It does not accept masks (example: `0` as last number is not valid).

## Associations

An association is a relation between one or more tables.

### hasOne

Is a **many to one** relationship. It's the same as **belongs to.**<br/>
Eg: `Animal.hasOne('owner', Person)`.<br/>
Animal can only have one owner, but Person can have many animals.<br/>
Animal will have the `owner_id` property automatically added.

The following functions will become available:
```js
animal.getOwner(function..)         // Gets owner
animal.setOwner(person, function..) // Sets owner_id
animal.hasOwner(function..)         // Checks if owner exists
animal.removeOwner()                // Sets owner_id to 0
```

**Reverse access**

```js
Animal.hasOne('owner', Person, {reverse: 'pets'})
```

will add the following:

```js
person.getPets(function..)
person.setPets(cat, function..)
```

### hasMany

Is a **many to many** relationship (includes join table).<br/>
Eg: `Patient.hasMany('doctors', Doctor, { why: String }, { reverse: 'patients' })`.<br/>
Patient can have many different doctors. Each doctor can have many different patients.

This will create a join table `patient_doctors` when you call `Patient.sync()`:

 column name | type
 :-----------|:--------
 patient_id  | Integer
 doctor_id   | Integer
 why         | varchar(255)

The following functions will be available:

```js
patient.getDoctors(function..)           // List of doctors
patient.addDoctors(docs, function...)    // Adds entries to join table
patient.setDoctors(docs, function...)    // Removes existing entries in join table, adds new ones
patient.hasDoctors(docs, function...)    // Checks if patient is associated to specified doctors
patient.removeDoctors(docs, function...) // Removes specified doctors from join table

doctor.getPatients(function..)
etc...
```

To associate a doctor to a patient:

```js
patient.addDoctor(surgeon, {why: "remove appendix"}, function(err) { ... } )
```

which will add `{patient_id: 4, doctor_id: 6, why: "remove appendix"}` to the join table.

### extendsTo

If you want to split maybe optional properties into different tables or collections. Every extension will be in a new table,
where the unique identifier of each row is the main model instance id. For example:

```js
var Person = db.define("person", {
    name : String
});
var PersonAddress = Person.extendsTo("address", {
    street : String,
    number : Number
});
```

This will create a table `person` with columns `id` and `name`. The extension will create a table `person_address` with
columns `person_id`, `street` and `number`. The methods available in the `Person` model are similar to an `hasOne`
association. In this example you would be able to call `.getAddress(cb)`, `.setAddress(Address, cb)`, ..

**Note:** you don't have to save the result from `Person.extendsTo`. It returns an extended model. You can use it to query
directly this extended table (and even find the related model) but that's up to you. If you only want to access it using the
original model you can just discard the return.

### Examples & options

If you have a relation of 1 to n, you should use `hasOne` (belongs to) association.

```js
var Person = db.define('person', {
    name : String
});
var Animal = db.define('animal', {
    name : String
});
Animal.hasOne("owner", Person); // creates column 'owner_id' in 'animal' table

// get animal with id = 123
Animal.get(123, function (err, animal) {
    // animal is the animal model instance, if found
    Foo.getOwner(function (err, person) {
        // if animal has really an owner, person points to it
    });
});
```

You can mark the `owner_id` field as required in the database by specifying the `required` option:
```js
Animal.hasOne("owner", Person, { required: true });
```

If you prefer to use another name for the field (owner_id) you can change this parameter in the settings.

```js
db.settings.set("properties.association_key", "id_{name}"); // {name} will be replaced by 'owner' in this case
```

**Note: This has to be done before the association is specified.**

The `hasMany` associations can have additional properties in the association table.

```js
var Person = db.define('person', {
    name : String
});
Person.hasMany("friends", {
    rate : Number
});

Person.get(123, function (err, John) {
    John.getFriends(function (err, friends) {
        // assumes rate is another column on table person_friends
        // you can access it by going to friends[N].extra.rate
    });
});
```

If you prefer you can activate `autoFetch`.
This way associations are automatically fetched when you get or find instances of a model.

```js
var Person = db.define('person', {
  name : String
});
Person.hasMany("friends", {
    rate : Number
}, {
    autoFetch : true
});

Person.get(123, function (err, John) {
    // no need to do John.getFriends() , John already has John.friends Array
});
```

You can also define this option globally instead of a per association basis.

```js
var Person = db.define('person', {
    name : String
}, {
    autoFetch : true
});
Person.hasMany("friends", {
    rate : Number
});
```

Associations can make calls to the associated Model by using the `reverse` option. For example, if you have an
association from ModelA to ModelB, you can create an accessor in ModelB to get instances from ModelA.
Confusing? Look at the next example.

```js
var Pet = db.define('pet', {
    name : String
});
var Person = db.define('person', {
    name : String
});
Pet.hasOne("owner", Person, {
    reverse : "pets"
});

Person(4).getPets(function (err, pets) {
    // although the association was made on Pet,
    // Person will have an accessor (getPets)
    //
    // In this example, ORM will fetch all pets
    // whose owner_id = 4
});
```

This makes even more sense when having `hasMany` associations since you can manage the *many to many*
associations from both sides.

```js
var Pet = db.define('pet', {
    name : String
});
var Person = db.define('person', {
    name : String
});
Person.hasMany("pets", Pet, {
    bought  : Date
}, {
    reverse : "owners"
});

Person(1).getPets(...);
Pet(2).getOwners(...);
```

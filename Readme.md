## Object Relational Mapping

[![Build Status](https://api.travis-ci.org/dresende/node-orm2.svg?branch=master)](http://travis-ci.org/dresende/node-orm2)
[![](https://badge.fury.io/js/orm.svg)](https://npmjs.org/package/orm)
[![](https://gemnasium.com/dresende/node-orm2.png)](https://gemnasium.com/dresende/node-orm2)
[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=dresende&url=https://github.com/dresende/node-orm2&title=ORM&language=&tags=github&category=software)

## Install

```sh
npm install orm
```

## Node.js Version Support

Supported: 0.12 - 4.0 +

Tests are run on [Travis CI](https://travis-ci.org/)
If you want you can run tests locally:

```sh
npm test
```

## DBMS Support

- MySQL & MariaDB
- PostgreSQL
- Amazon Redshift
- SQLite
- MongoDB (beta, missing aggregation for now)

## Features

- Create Models, sync, drop, bulk create, get, find, remove, count, aggregated functions
- Create Model associations, find, check, create and remove
- Define custom validations (several builtin validations, check instance properties before saving - see [enforce](http://github.com/dresende/node-enforce) for details)
- Model instance caching and integrity (table rows fetched twice are the same object, changes to one change all)
- Plugins: [MySQL FTS](http://dresende.github.io/node-orm-mysql-fts) , [Pagination](http://dresende.github.io/node-orm-paging) , [Transaction](http://dresende.github.io/node-orm-transaction), [Timestamps](http://github.com/SPARTAN563/node-orm-timestamps), [Migrations](https://github.com/locomote/node-migrate-orm2)

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
		age       : Number, // FLOAT
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
			age: orm.enforce.ranges.number(18, undefined, "under-age")
		}
	});

    // add the table to the database
	db.sync(function(err) {
		if (err) throw err;

		// add a row to the person table
		Person.create({ id: 1, name: "John", surname: "Doe", age: 27 }, function(err) {
			if (err) throw err;

				// query the person table by surname
				Person.find({ surname: "Doe" }, function (err, people) {
			        // SQL: "SELECT * FROM person WHERE surname = 'Doe'"
		        	if (err) throw err;

			        console.log("People found: %d", people.length);
			        console.log("First person: %s, age %d", people[0].fullName(), people[0].age);

			        people[0].age = 16;
			        people[0].save(function (err) {
			            // err.msg = "under-age";
		        });
		    });

		});
	});
});
```

## Promises

You can use the [promise enabled wrapper library](https://github.com/rafaelkaufmann/q-orm).


## Express

If you're using Express, you might want to use the simple middleware to integrate more easily.

```js
var express = require('express');
var orm = require('orm');
var app = express();

app.use(orm.express("mysql://username:password@host/database", {
	define: function (db, models, next) {
		models.person = db.define("person", { ... });
		next();
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

## Examples

See `examples/anontxt` for an example express based app.

## Documentation

Documentation is moving to the [wiki](https://github.com/dresende/node-orm2/wiki/).

## Settings

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Settings).

## Connecting

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Connecting-to-Database).

## Models

A Model is an abstraction over one or more database tables. Models support associations (more below). The name of the model is assumed to match the table name.

Models support behaviours for accessing and manipulating table data.

## Defining Models

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Defining-Models).

### Properties

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Model-Properties).

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
    height  : { type: 'integer' }
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

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Syncing-and-dropping-models).

## Dropping Models

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Syncing-and-dropping-models).

## Advanced Options

ORM2 allows you some advanced tweaks on your Model definitions. You can configure these via settings or in the call to `define` when you setup the Model.

For example, each Model instance has a unique ID in the database. This table column is added automatically, and called "id" by default.<br/>
If you define your own `key: true` column, "id" will not be added:

```js
var Person = db.define("person", {
	personId : { type: 'serial', key: true },
	name     : String
});

// You can also change the default "id" property name globally:
db.settings.set("properties.primary_key", "UID");

// ..and then define your Models
var Pet = db.define("pet", {
	name : String
});
```

**Pet** model will have 2 columns, an `UID` and a `name`.

It's also possible to have composite keys:

```js
var Person = db.define("person", {
	firstname : { type: 'text', key: true },
	lastname  : { type: 'text', key: true }
});
```

Other options:

- `identityCache`  : (default: `false`) Set it to `true` to enable identity cache ([Singletons](#singleton)) or set a timeout value (in seconds);
- `autoSave`       : (default: `false`) Set it to `true` to save an Instance right after changing any property;
- `autoFetch`      : (default: `false`) Set it to `true` to fetch associations when fetching an instance from the database;
- `autoFetchLimit` : (default: `1`) If `autoFetch` is enabled this defines how many hoops (associations of associations)
  you want it to automatically fetch.

## Hooks

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Model-Hooks).

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

You can also use raw SQL when searching. It's documented in the *Chaining* section below.

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

### Chaining

If you prefer less complicated syntax you can chain `.find()` by not giving a callback parameter.

```js
Person.find({ surname: "Doe" }).limit(3).offset(2).only("name", "surname").run(function (err, people) {
    // finds people with surname='Doe', skips first 2 and limits to 3 elements,
    // returning only 'name' and 'surname' properties
});
```
If you want to skip just one or two properties, you can call `.omit()` instead of `.only`.

Chaining allows for more complicated queries. For example, we can search by specifying custom SQL:
```js
Person.find({ age: 18 }).where("LOWER(surname) LIKE ?", ['dea%']).all( ... );
```
It's bad practice to manually escape SQL parameters as it's error prone and exposes your application to SQL injection.
The `?` syntax takes care of escaping for you, by safely substituting the question mark in the query with the parameters provided.
You can also chain multiple `where` clauses as needed.

`.find`, `.where` & `.all` do the same thing; they are all interchangeable and chainable.

You can also `order` or `orderRaw`:
```js
Person.find({ age: 18 }).order('-name').all( ... );
// see the 'Raw queries' section below for more details
Person.find({ age: 18 }).orderRaw("?? DESC", ['age']).all( ... );
```

You can also chain and just get the count in the end. In this case, offset, limit and order are ignored.

```js
Person.find({ surname: "Doe" }).count(function (err, people) {
    // people = number of people with surname="Doe"
});
```

Also available is the option to remove the selected items.
Note that a chained remove will not run any hooks.

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
{ col1: orm.not_between(123, 456) } // `col1` NOT BETWEEN 123 AND 456
{ col1: orm.like(12 + "%") } // `col1` LIKE '12%'
{ col1: orm.not_like(12 + "%") } // `col1` NOT LIKE '12%'
{ col1: orm.not_in([1, 4, 8]) } // `col1` NOT IN (1, 4, 8)
```

#### Raw queries

```js
db.driver.execQuery("SELECT id, email FROM user", function (err, data) { ... })

// You can escape identifiers and values.
// For identifier substitution use: ??
// For value substitution use: ?
db.driver.execQuery(
  "SELECT user.??, user.?? FROM user WHERE user.?? LIKE ? AND user.?? > ?",
  ['id', 'name', 'name', 'john', 'id', 55],
  function (err, data) { ... }
)

// Identifiers don't need to be scaped most of the time
db.driver.execQuery(
  "SELECT user.id, user.name FROM user WHERE user.name LIKE ? AND user.id > ?",
  ['john', 55],
  function (err, data) { ... }
)
```

### Identity pattern

You can use the identity pattern (turned off by default). If enabled, multiple different queries will result in the same result - you will
get the same object. If you have other systems that can change your database or you need to call some manual SQL queries,
you shouldn't use this feature. It is also know to cause some problems with complex
autofetch relationships. Use at your own risk.

It can be enabled/disabled per model:

```js
var Person = db.define('person', {
	name          : String
}, {
	identityCache : true
});
```

and also globally:

```js
orm.connect('...', function(err, db) {
  db.settings.set('instance.identityCache', true);
});
```

The identity cache can be configured to expire after a period of time by passing in a number instead of a
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

See information in the [wiki](https://github.com/dresende/node-orm2/wiki/Model-Validations).

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

**Chain Find**

The hasOne association is also chain find compatible. Using the example above, we can do this to access a new instance of a ChainFind object:

```js
Animal.findByOwner({ /* options */ })
```

**Reverse access**

```js
Animal.hasOne('owner', Person, {reverse: 'pets'})
```

will add the following:

```js
// Instance methods
person.getPets(function..)
person.setPets(cat, function..)

// Model methods
Person.findByPets({ /* options */ }) // returns ChainFind object
```

### hasMany

Is a **many to many** relationship (includes join table).<br/>
Eg: `Patient.hasMany('doctors', Doctor, { why: String }, { reverse: 'patients', key: true })`.<br/>
Patient can have many different doctors. Each doctor can have many different patients.

This will create a join table `patient_doctors` when you call `Patient.sync()`:

 column name | type
 :-----------|:--------
 patient_id  | Integer (composite key)
 doctor_id   | Integer (composite key)
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

// You can also do:
patient.doctors = [doc1, doc2];
patient.save(...)
```

To associate a doctor to a patient:

```js
patient.addDoctor(surgeon, {why: "remove appendix"}, function(err) { ... } )
```

which will add `{patient_id: 4, doctor_id: 6, why: "remove appendix"}` to the join table.

#### getAccessor

This accessor in this type of association returns a `ChainFind` if not passing a callback. This means you can
do things like:

```js
patient.getDoctors().order("name").offset(1).run(function (err, doctors), {
	// ... all doctors, ordered by name, excluding first one
});
```

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
    animal.getOwner(function (err, person) {
        // if animal has really an owner, person points to it
    });
});
```

You can mark the `owner_id` field as required in the database by specifying the `required` option:
```js
Animal.hasOne("owner", Person, { required: true });
```

If a field is not required, but should be validated even if it is not present, then specify the `alwaysValidate` option.
(this can happen, for example when validation of a null field depends on other fields in the record)
```js
Animal.hasOne("owner", Person, { required: false, alwaysValidate: true });
```

If you prefer to use another name for the field (owner_id) you can change this parameter in the settings.

```js
db.settings.set("properties.association_key", "{field}_{name}"); // {name} will be replaced by 'owner' and {field} will be replaced by 'id' in this case
```

**Note: This has to be done before the association is specified.**

The `hasMany` associations can have additional properties in the association table.

```js
var Person = db.define('person', {
    name : String
});
Person.hasMany("friends", {
    rate : Number
}, {}, { key: true });

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
    key       : true, // Turns the foreign keys in the join table into a composite key
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
}, {
  key: true
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
    key     : true,
    reverse : "owners"
});

Person(1).getPets(...);
Pet(2).getOwners(...);
```

## Adding external database adapters

To add an external database adapter to `orm`, call the `addAdapter` method, passing in the alias to use for connecting
with this adapter, along with the constructor for the adapter:

```js
require('orm').addAdapter('cassandra', CassandraAdapter);
```

See [the documentation for creating adapters](./Adapters.md) for more details.

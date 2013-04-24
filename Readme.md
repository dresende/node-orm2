## Object Relational Mapping

[![Build Status](https://secure.travis-ci.org/dresende/node-orm2.png?branch=master)](http://travis-ci.org/dresende/node-orm2) [![](https://badge.fury.io/js/orm.png)](https://npmjs.org/package/orm)

## Install

```sh
npm install orm
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
- Plugins: [MySQL FTS](http://github.com/dresende/node-orm-mysql-fts)

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

You can pass in connection options either as a string:

```js
var orm = require("orm");

orm.connect("mysql://username:password@host/database?pool=true", function (err, db) {...}
```

Or as an object:

```js
var opts = {
  database : "dbname",
  protocol : "[mysql|postgres|redshift|sqlite]",
  host     : "127.0.0.1",
  port     : 3306,         // optional, defaults to database default
  username : "..",
  password : "..",
  query    : {
    pool  :  true|false    // optional, false by default
    debug : true|false    // optional, false by default
  }
};
orm.connect(opts, function (err, db) {...}
```
`pool` is only supported by mysql & postgres.


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

Available native object types are:

`String, Number, Boolean, Date, Object, Buffer`

If defining properties using the latter object syntax, the types are:

`text, number, boolean, date, enum, object, binary`

#### Options

##### [all types]
* `required`: true marks the column as `NOT NULL`, false (default)
* `defaultValue`: sets the default value for the field

##### string
* `size`: max length of the string

##### number
* `rational`: true (default) creates a FLOAT/REAL, false an INTEGER

##### date
* `time`: true (default) creates a DATETIME/TIMESTAMP, false a DATE

Note that these may vary accross drivers.

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
- `beforeSave` : (no parameters) Right before trying to save;
- `afterSave` : (bool success) Right after saving;
- `beforeCreate` : (no parameters) Right before trying to save a new instance;
- `afterCreate` : (bool success) Right after saving a new instance;
- `beforeRemove` : (no parameters) Right before trying to remove an instance.
- `afterRemove` : (bool success) Right after removing an instance;

All hook function are called with `this` as the instance so you can access anything you want related to it.

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
Here's an example to illustrate how to use groupby:
```js
//The same as "select avg(weight), age from person where country='someCountry' group by age;"
Person.aggregate(["age"], { country: "someCountry" }).avg("weight").groupBy("age").get(function (err, stats) {
    // stats is an Array, each item should have 'age' and 'avg_weight'
});
```

Possible aggregating functions:

- `min`
- `max`
- `avg`
- `sum`
- `count` (there's a shortcut to this - `Model.count`)

### Available options

- `offset`: discards the first `N` elements
- `limit`: although it can be passed as a direct argument, you can use it here if you prefer
- `only`: if you don't want all properties, you can give an array with the list of properties you want

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

### Updating items (called Instances)

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

## Associations

An association is a relation between one or more tables.

## hasOne vs. hasMany

Since this topic brings some confusion to many people including myself, here's a list of the possibilities
supported by both types of association.

- `hasOne` : it's a **Many-to-One** relationship. A.hasOne(B) means A will have one (or none) of B, but B can be
  associated with many A;
- `hasMany`: it's a **One-to-Many** relationship. A.hasMany(B) means A will have none, one or more of B. Actually
  B will be associated with possibly many A but you don't have how to find it easily (see next);
- `hasMany` + reverse: it's a **Many-to-Many** relationship. A.hasMany(B, { reverse: A }) means A can have none or
  many B and also B can have none or many A. Accessors will be created in both models so you can manage them from
  both sides.

If you have a relation of 1 to 0 or 1 to 1, you should use `hasOne` association. This assumes a column in the model that has the id of the other end of the relation.

```js
var Person = db.define('person', {
	name : String
});
var Animal = db.define('animal', {
	name : String
});
Animal.hasOne("owner", Person); // assumes column 'owner_id' in 'animal' table

// get animal with id = 123
Animal.get(123, function (err, Foo) {
	// Foo is the animal model instance, if found
	Foo.getOwner(function (err, John) {
		// if Foo animal has really an owner, John points to it
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

**Note: This has to be done prior to the association creation.**

For relations of 1 to many you have to use `hasMany` associations. This assumes the existence of a separate join table that has 2 columns, each referencing the table in the association. Ideally, these would be foreign key relationships in your database.

```js
var Person = db.define('person', {
	name : String
});
Person.hasMany("friends"); // omitting the other Model, it will assume self model

Person.get(123, function (err, John) {
	John.getFriends(function (err, friends) {
		// assumes table person_friends with columns person_id and friends_id
	});
});
```

The `hasMany` associations can have additional properties that are assumed to be in the association table.

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

If you prefer you can activate `autoFetch`. This way associations are automatically fetched when you get or find instances of a model.

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

This makes even more sense when having `hasMany` associations since you can manage the Many-to-Many associations
from both sides.


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

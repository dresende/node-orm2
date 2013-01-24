## Object Relational Mapping

[![Build Status](https://secure.travis-ci.org/dresende/node-orm2.png)](http://travis-ci.org/dresende/node-orm2)

## Install

```sh
npm install orm@2.0.0-alpha9
```

Despite the alpha tag, this is the recommended version for new applications.

## DBMS Support

- MySQL
- PostgreSQL
- SQLite

## Features

- Create Models, sync, drop, bulk create, get, find, remove, count
- Create Model associations, find, check, create and remove
- Define custom validations (several builtin validations, check instance properties before saving)
- Instance singleton (table rows fetched twice are the same object, changes to one change all)

## Introduction

This is a node.js object relational mapping module.

Here is an example on how to use it:

```js
var orm = require('orm');

orm.connect("mysql://username:password@host/database", function (err, db) {
	if (err) throw err;

	var Person = db.define('person', {
		name      : String,
		surname   : String,
		age       : Number,
		male      : Boolean,
		continent : [ 'Europe', 'America', 'Asia', 'Africa', 'Australia', 'Antartica' ], // ENUM type
		photo     : Buffer, // BLOB/BINARY
		data      : Object // JSON encoded
	}, {
		methods: {
			fullName: function () {
				return this.name + ' ' + this.surname;
			}
		},
		validations: {
			age: orm.validators.rangeNumber(18, undefined, 'under-age')
		}
	});

	Person.find({ surname: "Doe" }, function (err, people) {
		// SQL: "SELECT * FROM person WHERE surname = 'Doe'"

		console.log("People found: %d", people.length);
		console.log("First person: %s, age %d", people[0].fullName(), people[0].age);

		people[0].age = 16;
		people[0].save(function (err) {
			// err.msg = 'under-age';
		});
	});
});
```

## Models

A Model is a structure binded to one or more tables, depending on the associations. The model name is assumed to be the table name. After defining a model you can use it to manipulate the table.

After defining a Model you can get a specific element or find one or more based on some conditions.

## Defining Models

To define a model, you use the reference to the database connection and call `define`. The function will define a Model
and will return it to you. You can get it later by it's id directly from the database connection so you don't actually
need to store a reference to it.

```js
var Person = db.define('person', {        // 'person' will be the table in the database as well as the model id
	// properties
	name    : String,                     // you can use native objects to define the property type
	surname : { type: "text", size: 50 }  // or you can be specific and define aditional options
}, {
	// options (optional)
});
```

## Loading Models

If you prefer to have your models defined in separated files, you can define them in a function inside a module and
export the function has the entire module. You can have cascading loads.

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

## Synching Models

If you don't have the tables on the database you have to call the `.sync()` on every Model. This will just create the
tables necessary for your Model. If you have more than one Model you can call `.sync()` directly on the database
connection to syncronize all Models.

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
of them and counting. This will actually tell the database server to do a count, the count is not done in javascript.

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

#### Available options

- `offset`: discards the first `N` elements
- `limit`: although it can be passed as a direct argument, you can use it here if you prefer
- `only`: if you don't want all properties, you can give an array with the list of properties you want

#### Chaining

If you prefer another less complicated syntax you can chain `.find()` by not giving a callback parameter.

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
```

## Associations

An association is a relation between one or more tables.

## hasOne vs. hasMany Associations

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

For relations of 1 to many you have to use `hasMany` associations. This assumes another table that has 2 columns, one for each table in the association.

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

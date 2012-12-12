## Object Relational Mapping

[![Build Status](https://secure.travis-ci.org/dresende/node-orm2.png)](http://travis-ci.org/dresende/node-orm2)

## Install

```sh
npm install orm@2.0.0-alpha6
```

Despite the alpha tag, this is the recommended version for new applications.

## DBMS Support

- MySQL
- PostgreSQL
- SQLite

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
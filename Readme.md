## Object Relational Mapping

[![Build Status](https://secure.travis-ci.org/dresende/node-orm2.png)](http://travis-ci.org/dresende/node-orm2)

## Install

```sh
npm install orm@2.0.0-alpha2
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
		data      : Object // JSON encoded
	});

	Person.find({ surname: "Doe" }, function (err, people) {
		// SQL: "SELECT * FROM person WHERE surname = 'Doe'"

		console.log("People found: %d", people.length);
		console.log("First person: %s", people[0].name);
	});
});
```

## Models

A Model is a structure binded to one or more tables, depending on the associations. The model name is assumed to be the table name. After defining a model you can use it to manipulate the table.

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
	Person.getFriends(function (err, friends) {
		// assumes table person_friends with columns person_id and friends_id
	});
});
```

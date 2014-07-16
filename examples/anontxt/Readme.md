# AnonTXT demo app

## Getting started

**Setup node-orm2!**

```bash
git clone https://github.com/dresende/node-orm2.git
cd node-orm2
npm install

# You may work off master, or checkout a different version if master is broken:
git tag
git checkout v2.1.4
```

**Setup AnonTXT**

Edit `anontxt/config/settings.js` to set your database, user & password.

```bash
cd examples/anontxt
npm install
node tasks/reset
./script/start
```

And then open up [localhost:3000](http://localhost:3000/)

You can also just run it with `node server.js` however the script launches nodemon which
automatically restarts the server if you change any code.

**Create table for mysql**

```sql
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `body` text NOT NULL,
  `message_id` int(11) NOT NULL,
  `createdAt` date NOT NULL,
  PRIMARY KEY (`id`)
)

CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(55) NOT NULL,
  `body` text NOT NULL,
  `createdAt` date NOT NULL,
  PRIMARY KEY (`id`)
)
```

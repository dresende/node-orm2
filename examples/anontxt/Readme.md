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
node tasks/reset # sets up the database
./script/start
```

And then open up [localhost:3000](http://localhost:3000/)

You can also just run it with `node server.js` however the script launches nodemon which
automatically restarts the server if you change any code.

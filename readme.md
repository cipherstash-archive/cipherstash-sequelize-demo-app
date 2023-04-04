# CipherStash + Sequelize example with Express

This is an example repo integrating `@cipherstash/pg-native` with Sequelize and Express.

## Running the demo

### Prerequisites

- Node.js >= 18.x
- [PostgreSQL](https://www.postgresql.org/download/)
- Optional: [direnv](https://direnv.net/docs/installation.html)

### Get started

0. Clone the repository:

``` bash
git clone https://github.com/cipherstash/cipherstash-sequelize-example
cd cipherstash-sequelize-example
```

1. Install dependencies:

```
npm install
```

2. Create the database:


```
npx sequelize-cli db:create
```

3. Run the migrations:

```
npx sequelize-cli db:migrate
```

4. Seed the database with example data:

```
npx sequelize-cli db:seed:all
```

5. Run the demo:

```
npm start
```

6. Navigate to `http://localhost:3000` to view the patients dashboard

We now have a running application with Sequelize and Express that we can use to learn how to configure CipherStash to encrypt data.

### Install the CipherStash CLI

The CipherStash CLI is used to manage your account (e.g login) and encryption schema.

The encryption schema defines what encrypted indexes exist, and what queries you can perform on those indexes.

Download the binary for your platform:

- [Linux ARM64](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-aarch64-unknown-linux-gnu)
- [Linux ARM64 musl](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-aarch64-unknown-linux-musl)
- [Linux x86_64](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-x86_64-unknown-linux-gnu)
- [Linux x86_64 musl](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-x86_64-unknown-linux-musl)
- [macOS ARM](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-aarch64-apple-darwin)
- [macOS x86_64](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-x86_64-apple-darwin)
- [Windows x86_64 GNU](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-x86_64-pc-windows-gnu.exe)
- [Windows x86_64 MSVC](https://github.com/cipherstash/cli-releases/releases/latest/download/stash-x86_64-pc-windows-msvc.exe)

Place the binary on your `$PATH`, so you can run it.

### Get a CipherStash account and workspace

To use CipherStash you'll need a CipherStash account and workspace.

You can signup from the CLI:

```bash
stash signup
```

>Your browser will open to [https://cipherstash.com/signup/stash](https://cipherstash.com/signup/stash) where you can sign up with either your GitHub account, or a standalone email.

### Install the CipherStash database driver

The CipherStash database driver transparently maps SQL statements to encrypted database columns.

It is installed by overriding the `pg-native` package with the drop in replacement `@cipherstash/pg-native`.

Under the hood `@cipherstash/pg-native` uses the package `@cipherstash/libpq` which contains the CipherStash postgres driver.

To install them both first install `@cipherstash/libpq`:

```
npm add @cipherstash/libpq
```

And then `@cipherstash/pg-native` using an npm alias:

```
npm add pg-native@npm:@cipherstash/pg-native
```

### Log in

Make sure `stash` is logged in:

``` bash
stash login
```

This will save a special token `stash` will use for talking to CipherStash.

### Create a dataset

Next, we need to create a dataset for tracking what data needs to be encrypted.

A dataset holds configuration for one or more database tables that contain data to be encrypted.

Create our first dataset by running:

```
stash datasets create patients --description "Data about patients"
```

The output will look like this:

```
Dataset created:
ID         : <a UUID style ID>
Name       : patients
Description: Data about patients
```

Note down the dataset ID, as you'll need it in the next steps.

### Create a client

Next we need to create a client.

A client allows an application to programatically access a dataset.

A dataset can have many clients (for example, different applications working with the same data), but a client belongs to exactly one dataset.

Use the dataset ID from step 2 to create a client (making sure you substitute your own dataset ID):

```
stash clients create --dataset-id $DATASET_ID "Express app"
```

The output will look like this:

```
Client created:
Client ID  : <a UUID style ID>
Name       : Express app
Description:
Dataset ID : <your provided dataset ID>

#################################################
#                                               #
#  Copy and store these credentials securely.   #
#                                               #
#  THIS IS THE LAST TIME YOU WILL SEE THE KEY.  #
#                                               #
#################################################

Client ID          : <a UUID style ID>

Client Key [hex]   : <a long hex string>
```

**Note down the client key somewhere safe**, like a password vault.
You will only ever see this credential once.
This is your personal key, and you should not share it.

Set these as environment variables in the `.envrc` file using the below variable names:

```bash
export CS_CLIENT_KEY=
export CS_CLIENT_ID=
```

If you're using `direnv` run:

```bash
direnv allow
```

If you're not you can export the variables by running:

```bash
source .envrc
```

### Push the dataset configuration

Now we need to configure what columns are encrypted, and what indexes we want on those columns.

This configuration is used by the CipherStash driver to transparently rewrite your app's SQL queries to use the underlying encrypted columns.

Our demo Sequelize app has a schema that looks like this:

```js
const SCHEMA = {
  full_name: DataTypes.STRING,
  email: DataTypes.STRING,
  dob: DataTypes.DATEONLY,
  weight: DataTypes.FLOAT,
  allergies: DataTypes.STRING,
  medications: DataTypes.STRING
}
```

In this example we want to encrypt all columns as they all could contain sensitive information.
However in different circumstances you may only encrypt a few of the columns.

We can configure what columns should be encrypted with a configuration file which is in the root of the demo titled `dataset.yml`:

This configuration file defines two types of encrypted indexes for the columns we want to protect:
  - A `match` index on the `full_name`, `email`, `allergies` and `medications` columns, for full text matches
  - An `ore` index on the `full_name`, `email`, `dob` and `weight` columns, for sorting and range queries

Now we push this configuration to CipherStash:

```bash
stash upload-config --file dataset.yml --client-id $CS_CLIENT_ID --client-key $CS_CLIENT_KEY
```

### Add and apply migrations

The first migration to run, is the install of the Protect custom types into your database.

This migration adds in the custom types `ore_64_8_v1` and `ore_64_8_v1_term`.

- `ore_64_8_v1` is used for `string` and `text` types.
- `ore_64_8_v1_term` is used for non string types.

We do this by creating a Sequelize migration:

```
npx sequelize-cli migration:generate --name add-protect-database-extensions
```

This will generate a migration file under `migrations/`.

Open up that migration file, and add this code to run the install/uninstall scripts packaged with `@cipherstash/libpq`:

```js
'use strict';

const { INSTALL_SQL, UNINSTALL_SQL } = require('@cipherstash/libpq/database-extensions/postgresql');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(INSTALL_SQL)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(UNINSTALL_SQL)
  }
};
```

The CipherStash driver works by rewriting your app's SQL queries to use the underlying encrypted columns.

To set up those encrypted columns, generate another Sequelize migration:

``` bash
npx sequelize-cli migration:generate --name add-protect-columns-to-patients-table
```

Per the last step, this will generate another migration file under `migrations/`.

Open up that new migration file, and add the following code that creates the CipherStash columns:

```js
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(q, { DataTypes }) {
    // Add columns for sorting and encrypting
    await q.addColumn("patients", "__full_name_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__full_name_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__full_name_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__full_name_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__email_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__email_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__email_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__email_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__dob_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__dob_ore", { type: "ore_64_8_v1_term" });

    await q.addColumn("patients", "__weight_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__weight_ore", { type: "ore_64_8_v1_term" });

    await q.addColumn("patients", "__allergies_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__allergies_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__allergies_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__allergies_unique", { type: DataTypes.TEXT });

    await q.addColumn("patients", "__medications_encrypted", { type: DataTypes.TEXT });
    await q.addColumn("patients", "__medications_ore", { type: "ore_64_8_v1" });
    await q.addColumn("patients", "__medications_match", { type: DataTypes.ARRAY(DataTypes.INTEGER) });
    await q.addColumn("patients", "__medications_unique", { type: DataTypes.TEXT });

    // Add indexes for all the ORE fields used for sorting and range queries
    await q.addIndex("patients", ["__full_name_ore"]);
    await q.addIndex("patients", ["__email_ore"]);
    await q.addIndex("patients", ["__dob_ore"]);
    await q.addIndex("patients", ["__weight_ore"]);
    await q.addIndex("patients", ["__allergies_ore"]);
    await q.addIndex("patients", ["__medications_ore"]);

    // Add indexes for all the match fields used for full text searches
    await q.addIndex("patients", ["__full_name_match"], { using: "GIN" });
    await q.addIndex("patients", ["__email_match"], { using: "GIN" });
    await q.addIndex("patients", ["__allergies_match"], { using: "GIN" });
    await q.addIndex("patients", ["__medications_match"], { using: "GIN" });
  }
}
```

The `_encrypted` columns are the encrypted values, and the `_match` and `_ore` columns are the encrypted indexes.

Once the migrations have been created you can run the migrations using the following `sequelize-cli` command:

```bash
npx sequelize-cli db:migrate
```

### Encrypt the sensitive data

Now we have the necessary database structure in place, it's time to encrypt your data.

This is done by iterating through all your data and saving it back to the database.
When the data is saved the `@cipherstash/pg-native` will intercept and encrypt the updates.

There is a script provided at the root of the demo that uses a naive method to iterate through and save everything.

You can run it with the following command:

```
node encrypt-data.js
```

In future there will be a method provided that handles this in an efficient way.

### Changing column modes

The provided CipherStash configuration in the `dataset.yml` file sets all columns to the `plaintext-duplicate` mode.
In this mode all data is read from the plaintext fields but writes will save both plaintext and ciphertext.

To test that queries are working properly change all columns in the `dataset.yml` to use `encrypted-duplicate` mode.
In this mode all data is read from ciphertext fields and writes will save both plaintext and ciphertext.

After updating the configuration push it to CipherStash:

```bash
stash upload-config --file dataset.yml --client-id $CS_CLIENT_ID --client-key $CS_CLIENT_KEY
```

After the upload completes start the server and navigate to `localhost:3000` to verify all patients are showing correctly
```
npm start
```

### Dropping plaintext columns

Once you're sure that everything is working correctly change the column mode to be the `encrypted` mode.
In this mode all data is encrypted and plaintext columns are completely ignored.

Once you've verified that everything is you can create a migration that drops the original columns.

Create the migration using `sequelize-cli`:

```
npx sequelize-cli migration:generate --name drop-plaintext-columns
```

And set the migration to remove the plaintext columns:

```
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    await queryInterface.removeColumn("patients", "full_name");
    await queryInterface.removeColumn("patients", "email");
    await queryInterface.removeColumn("patients", "dob");
    await queryInterface.removeColumn("patients", "weight");
    await queryInterface.removeColumn("patients", "allergies");
    await queryInterface.removeColumn("patients", "medications");
  },
};
```

Once you're sure that you're ready to drop the original columns run the migration:

```
npx sequelize-cli db:migrate
```

> Note: it's very important that all your data is encrypted before running the remove column step and you have created backups of the database in case anything goes wrong. Once you remove the plaintext columns anything that hasn't been encrypted will be lost.

To verify everything is still working correctly check out the demo app on `localhost:3000`

```
npm start
```

### Viewing logs of encryptions and decryptions

To view the logs showing encryptions and decryptions of data, go to your workspace folder `~/.cipherstash/<your workspace id>`.

Run:

```bash
tail -F decryptions.log
```

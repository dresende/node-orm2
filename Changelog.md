### v2.0.1 - 21 Feb 2013

- Changes singleton to support cache value as a number (timeout in seconds)
- Fixes bug when escaping boolean values in postgres
- Fixes bug on Model.sync (postgres) when property has default value (using wrong path to escape method)
- Fixes DDL drivers creating duplicated field in reversed hasOne associations
- Changes Model instanciation to extend association properties
- Adds support to Amazon Redshift based on PostgreSQL driver

### v2.0.0 - 21 Feb 2013

- Initial release

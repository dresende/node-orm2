test:
	ORM_PROTOCOL=mysql    node test/run
	ORM_PROTOCOL=postgres node test/run
	ORM_PROTOCOL=redshift node test/run
	ORM_PROTOCOL=sqlite   node test/run
	ORM_PROTOCOL=mongodb  node test/run

.PHONY: test

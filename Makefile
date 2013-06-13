test:
	ORM_PROTOCOL=mysql node test/run
	ORM_PROTOCOL=postgres node test/run
	ORM_PROTOCOL=redshift node test/run
	ORM_PROTOCOL=sqlite node test/run

coverage: cov

cov:
	rm -rf lib-cov
	jscoverage lib lib-cov
	mv package.json test/support/
	cp test/support/coverage-package.json package.json
	ORM_PROTOCOL=mysql mocha -R html-cov test/integration2/ > test/coverage.html
	mv test/support/package.json .

.PHONY: test

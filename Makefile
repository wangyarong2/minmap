install:
	@npm install
	@cd assets && npm install

release: front
	@echo "env: ${env}"
	@rm -rf out/
	@mkdir -p out/release
	@if [ -d assets/.package ]; then\
		rsync -av . out/release --exclude .git --exclude node_modules --exclude out --exclude test --exclude assets;\
		mv assets/.package out/release/assets;\
	else\
		rsync -av . out/release --exclude .git --exclude node_modules --exclude out --exclude test;\
	fi
	# sed "s#prefix:#apiEndpoint: '<%=apiEndpoint%>', prefix:#" out/release/assets/index.html > out/release/view/index.ejs && rm out/release/assets/index.html
	node tools/upload-to-oss.js
	@cd out/release && NODE_ENV=${env} npm install
	@if [ -f out/release/config/config_${env}.js ]; then\
		cp out/release/config/config_${env}.js out/release/config/config.js;\
	fi

front:
	@echo "building assets..."
	@cd assets && npm run build
	@if [ -d assets/static ]; then\
		cp -r assets/static assets/.package/static;\
	fi
	@if [ -d assets/src/statics ]; then\
		mkdir -p assets/.package/src/statics && cp -r assets/src/statics assets/.package/src/;\
	fi
	@echo "assets build done\n"

test:
	@node_modules/.bin/mocha --require intelli-espower-loader $(shell find test -name *.test.js)

cover:
	@node_modules/.bin/istanbul cover node_modules/.bin/_mocha -- $(shell find test -name *.test.js)

clean:
	@rm -rf node_modules assets/node_modules

.PHONY: install release front test cover clean

.PHONY: clean serve open

# aliases
run: ./out
gravity: ./gravity/out

# build gravity
GRAVITY_IN = $(shell echo ./gravity/*.ts)
./gravity/out/gravity.mjs: $(GRAVITY_IN)
	cd ./gravity && deno run -A ./build.ts

# build the rest of the owl
IN_FILES = $(shell find ./in -type f)
SRC_FILES = $(shell echo ./src/*.*)
./out: $(IN_FILES) $(SRC_FILES) ./gravity/out/gravity.mjs
	deno run -A src/index.ts

clean:
	rm -rf ./out

serve:
	miniserve ./out --index index.html -v

open:
	start "http://[::1]:8080"
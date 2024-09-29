.PHONY: clean serve

# alias
run: ./out

IN_FILES = $(shell find ./in -type f)
SRC_FILES = $(shell find ./src -type f)

./out: $(IN_FILES) $(SRC_FILES)
	deno run -A src/index.ts

clean:
	rm -rf ./out

serve:
	miniserve ./out --index index.html -v
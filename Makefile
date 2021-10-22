.PHONY: run build

run: build
	yarn electron .

build: out/reaction-diffusion.js

out/reaction-diffusion.js: rollup.config.js ./*.ts
	yarn rollup -c rollup.config.js


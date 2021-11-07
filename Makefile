.PHONY: run build-webgl build-canvas clean

run: build-webgl
	yarn electron .

build-webgl: out/reaction-diffusion-webgl.js

build-canvas: out/reaction-diffusion-canvas.js

clean:
	rm out/*

B_FLAGS := --bundle --platform=browser --define:global=window --loader:.glsl=text

out/%.js: %.ts ./*.ts
	yarn esbuild $*.ts --outfile=$@ $(B_FLAGS)

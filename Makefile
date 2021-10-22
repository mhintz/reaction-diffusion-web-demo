.PHONY: run build

run: build
	yarn electron .

B_FLAGS := --bundle --platform=browser --define:global=window --loader:.glsl=text

build: ./*.ts
	yarn esbuild reaction-diffusion-webgl.ts --outfile=out/reaction-diffusion-webgl.js $(B_FLAGS)

build-canvas: ./*.ts
	yarn esbuild reaction-diffusion-canvas.ts --outfile=out/reaction-diffusion-canvas.js $(B_FLAGS)

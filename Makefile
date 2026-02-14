node_modules: package.json
	pnpm i

up: node_modules
	pnpm dev

img:
	cd scripts && caddy run

note:
	./scripts/new_note.sh "$(title)"
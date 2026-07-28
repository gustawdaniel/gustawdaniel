node_modules: package.json
	pnpm i

up: node_modules
	pnpm dev

img-pull:
	./scripts/sync_images.sh pull

img-push:
	./scripts/sync_images.sh push

img-sync:
	./scripts/sync_images.sh sync

note:
	./scripts/new_note.sh "$(title)"
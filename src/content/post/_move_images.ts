import fs from "fs";
import assert from "node:assert";

const assets = __dirname
	.split("/")
	.splice(0, __dirname.split("/").length - 2)
	.concat("assets")
	.join("/");

async function main() {
	const dirs = ["en", "pl"] as const;
	for (const dir of dirs) {
		const posts = fs.readdirSync(`${__dirname}/${dir}`).filter((p: string) => !p.startsWith("_"));
		for (const post of posts) {
			const date = post.substring(0, 10);
			assert.ok(/\d{4}-\d{2}-\d{2}/.test(date));

			const images = fs
				.readdirSync(`${__dirname}/${dir}/${post}`)
				.filter((image: string) => !image.startsWith("index"));

			let indexText = fs.readFileSync(`${__dirname}/${dir}/${post}/index.md`).toString();
			assert.ok(indexText);

			console.log("indexText 1", indexText.length);

			for (const image of images) {
				console.log("im", date, image);

				if (!fs.existsSync(assets + "/" + date)) {
					fs.mkdirSync(assets + "/" + date);
				}
				if (!fs.existsSync(`${assets}/${date}/${image}`)) {
					fs.copyFileSync(`${__dirname}/${dir}/${post}/${image}`, `${assets}/${date}/${image}`);
				}

				fs.unlinkSync(`${__dirname}/${dir}/${post}/${image}`);

				indexText = indexText.replaceAll(
					`![](./${image})`,
					`![](../../../../assets/${date}/${image})`
				);
			}

			assert.ok(indexText);
			console.log("indexText 2", indexText.length);

			fs.writeFileSync(`${__dirname}/${dir}/${post}/index.md`, indexText);
		}
	}

	console.log();
}

main().catch(console.error);

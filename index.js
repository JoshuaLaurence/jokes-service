const express = require("express");
const app = express();
const {Joke, sequelize} = require("./db");

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/jokes", async (req, res, next) => {
	try {
		let {content, tags} = req.query;
		let jokes = [];

		if (!content) content = "";
		if (!tags) tags = "";

		console.log("tags", tags, "- content", content);

		if (content === "" && tags === "") {
			jokes = await Joke.findAll({});
		} else {
			jokes = await Joke.findAll({
				where: {
					content: sequelize.where(
						sequelize.fn("LOWER", sequelize.col("joke")),
						"LIKE",
						"%" + content.toLowerCase() + "%"
					),
				},
			});
			if (tags) {
				jokes = jokes.filter((element) => {
					const element_tags = element.tags.includes(",")
						? element.tags.split(",").map((element) => element.trim())
						: [element.tags];
					tags = Array.isArray(tags) ? tags : [tags];

					console.log(element_tags, tags);
					if (tags.every((element) => element_tags.includes(element))) return true;
					return false;
				});
			}
		}
		res.type("json").send(JSON.stringify(jokes, null, 2) + "\n");
	} catch (error) {
		console.error(error);
		next(error);
	}
});

app.post("/jokes", async (req, res, next) => {
	try {
		const body = req.body;
		console.log(body);
		if (!Object.keys(body).includes("content"))
			throw new Error("Content must be present to create a joke");
		if (!Object.keys(body).includes("tags"))
			throw new Error("Tags must be present to create a joke");

		const newJoke = await Joke.create({
			joke: body.content,
			tags: body.tags,
		});

		res
			.type("json")
			.status(200)
			.send(
				JSON.stringify({message: "New Joke Created", newJoke: newJoke}, null, 2)
			);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

app.delete("/jokes/:id", async (req, res, next) => {
	try {
		await Joke.destroy({where: {id: req.params.id}});
		res
			.type("json")
			.status(200)
			.send(
				JSON.stringify(
					{message: `Joke of ID ${req.params.id} successfully deleted`},
					null,
					2
				)
			);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

app.put("/jokes/:id", async (req, res, next) => {
	try {
		const id = req.params.id;
		const body = req.body;
		console.log(body);

		let filteredBody = {};
		//Removing any keys that aren't correct from the body incase the body were to have more info (metadata) within
		for (const key in body) {
			if (key === "tags") {
				filteredBody[key] = body[key];
			} else if (key === "content") {
				filteredBody["joke"] = body[key];
			}
		}
		//presuming the body has already been formatted by the front end correctly
		//I.E the tags are a single string with no spaces seperated by commas, you can
		//input the whole body into the update parameter, that way you don't have to check\
		//if all or both of the keys are present. Whatever is there is directly inputted

		await Joke.update(filteredBody, {where: {id: id}});
		const updatedResult = await Joke.findByPk(id);
		res
			.type("json")
			.status(200)
			.send(
				JSON.stringify(
					{
						message: `Joke of ID ${req.params.id} successfully updated`,
						updatedJoke: updatedResult,
					},
					null,
					2
				)
			);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;

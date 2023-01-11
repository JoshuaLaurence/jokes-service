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
					tags: sequelize.where(
						sequelize.fn("LOWER", sequelize.col("tags")),
						"LIKE",
						"%" + tags.toLowerCase() + "%"
					),
				},
			});
		}
		res.type("json").send(JSON.stringify(jokes, null, 2) + "\n");
	} catch (error) {
		console.error(error);
		next(error);
	}
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;

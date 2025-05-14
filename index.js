var express = require("express");
var cors = require("cors");
var app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", function (req, res, next) {
	res.send("Hello world");
});

app.listen(port, function () {
	console.log("CORS-enabled web server listening on port ", port);
});

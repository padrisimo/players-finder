const Hapi = require("@hapi/hapi");
const mongoose = require("mongoose");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");

mongoose.connect("mongodb://localhost:27017/acme", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const PlayerModel = mongoose.model("player", {
  nickName: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  interest: [String],
  age: { type: Number, required: true },
  canHost: { type: Boolean, required: true }
});

const GameModel = mongoose.model("game", {
  name: { type: String, required: true },
  minPlayers: { type: Number, required: true },
  maxPlayers: { type: Number, required: true }
});

const server = Hapi.server({
  port: 3000,
  host: "localhost"
});

server.route({
  method: "GET",
  path: "/",
  handler: (request, reply) => {
    return reply.redirect("/documentation");
  }
});

server.route({
  method: "POST",
  path: "/addplayer",
  handler: async (request, h) => {
    try {
      var player = new PlayerModel(request.payload);
      var result = await player.save();
      return h.response(result);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

// todo filter them by interesting games field
server.route({
  method: "GET",
  path: "/players",
  options: { tags: ["api"], description: "get list of all players" },
  handler: async (request, h) => {
    try {
      var player = await PlayerModel.find().exec();
      return h.response(player);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

const init = async () => {
  const swaggerOptions = {
    info: {
      title: "Test API Documentation",
      version: "0.1"
    }
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions
    }
  ]);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();

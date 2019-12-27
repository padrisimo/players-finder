const Hapi = require("@hapi/hapi");
const mongoose = require("mongoose");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const HapiSwagger = require("hapi-swagger");
const Joi = require("@hapi/joi");

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

const CustomGameModel = mongoose.model("game", {
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
  options: {
    tags: ["api"],
    description: "add a new player"
  },
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

server.route({
  method: "POST",
  path: "/new/custom-game",
  options: {
    tags: ["api"],
    description: "add a new custom game",
    validate: {
      payload: Joi.object({
        name: Joi.string().required(),
        minPlayers: Joi.number().required(),
        maxPlayers: Joi.number().required()
      })
    }
  },
  handler: async (request, h) => {
    try {
      var game = new CustomGameModel(request.payload);
      var result = await game.save();
      return h.response(result);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

server.route({
  method: "POST",
  path: "/new/risk",
  options: {
    tags: ["api"],
    description: "add a new risk game",
    validate: {
      payload: Joi.object({
        minPlayers: Joi.number().required(),
        maxPlayers: Joi.number().required()
      })
    }
  },
  handler: async (request, h) => {
    try {
      var game = new CustomGameModel({ name: "Risk", ...request.payload });
      var result = await game.save();
      return h.response(result);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

server.route({
  method: "GET",
  path: "/players",
  options: {
    tags: ["api"],
    description: "get list of all players",
    notes:
      "u can pass an optional 'interest' filter as query string in the url like this /players?interest=Risk ",
    validate: {
      query: Joi.object({
        interest: Joi.string()
          .valid("Risk", "Chest", "Catan", "Others")
          .optional()
      })
    }
  },

  handler: async (request, h) => {
    var params = request.query;

    try {
      var player = await PlayerModel.find(
        Object.keys(request.query).length !== 0
          ? { interest: params.interest }
          : null
      ).exec();
      return h.response(player);
    } catch (error) {
      return h.response(error).code(500);
    }
  }
});

const init = async () => {
  const swaggerOptions = {
    info: {
      title: "Players Finder API",
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

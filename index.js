const Hapi = require("@hapi/hapi");
const mongoose = require("mongoose");
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
  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();

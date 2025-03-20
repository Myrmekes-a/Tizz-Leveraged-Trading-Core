import mongoose from "mongoose";

const PairSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  base: { type: String, required: true },
  quote: { type: String, required: true },
});

const PairModel = mongoose.model("pair", PairSchema);

export default PairModel;

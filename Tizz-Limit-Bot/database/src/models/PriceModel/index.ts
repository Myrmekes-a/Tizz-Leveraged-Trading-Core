import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
  pairIndex: { type: Number, required: true },
  price: { type: String, required: true },
  decimal: { type: Number, required: true },
  timestamp: { type: Date, required: true },
});

const PriceModel = mongoose.model("price", PriceSchema);

export default PriceModel;

import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
  pairIndex: { type: Number, required: true },
  price: { type: String, required: true },
  decimal: { type: Number, required: true },
  timestamp: { type: Date, required: true },
});

const PriceModel = mongoose.model("price", PriceSchema);

export default PriceModel;

function main() {
  PriceModel.collection
    .getIndexes()
    .then(indexes => {
      console.log("indexes: ", indexes);
    })
    .catch(err => console.log("index_error: ", err));

  PriceModel.collection
    .createIndex({ timestamp: 1, pairIndex: 1 })
    .then(res => {
      console.log("create_index: ", res);
    })
    .catch(err => {
      console.error("create_index_error: ", err);
    });
}

setTimeout(() => {
  main()
}, 10000) // after 10s
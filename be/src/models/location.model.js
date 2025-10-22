import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

locationSchema.plugin(mongoosePaginate);

export default mongoose.model("Location", locationSchema);
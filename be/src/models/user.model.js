import mongoose from 'mongoose'
import mongoosePaginate from "mongoose-paginate-v2"
import { IS_DELETED, USER_ROLE, USER_STATUS } from '../utils/constants'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLE),
    default: USER_ROLE.STAFF,
  },
  status: {
    type: Number,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: false
  },
  isDeleted: {
    type: Number,
    enum: Object.values(IS_DELETED),
    default: IS_DELETED.NO,
  },
},{
  timestamps: true,
  versionKey: false
})


userSchema.plugin(mongoosePaginate)
const User = mongoose.model('User',userSchema);

export default User;
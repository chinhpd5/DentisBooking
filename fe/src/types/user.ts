import { USER_STATUS } from "../contants";
// import { IStaff } from "./staff";

interface IUser {
  _id: string,
  name: string,
  username: string,
  role: string,
  status: USER_STATUS,
  // staffId: IStaff
}

export type Login = {
  username: string,
  password: string
}

export type CreateUser ={
  name: string,
  username: string,
  role: string,
  status: USER_STATUS,
  // staffId: IStaff,
  password: string
}

export default IUser;

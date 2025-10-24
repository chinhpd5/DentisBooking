import { USER_STATUS } from "../contants";

interface IUser {
  id: string,
  name: string,
  username: string,
  password: string,
  role: string,
  status: USER_STATUS,
}

export type Login = {
  username: string,
  password: string
}

export default IUser;

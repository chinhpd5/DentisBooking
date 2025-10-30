import { IS_DELETED,TRICK_STATUS } from "../contants";
import IJob from "./job";
import { IStaff } from "./staff";

interface ITrick {
  _id: string;
  name: string;
  time: number;
  staffIds: IStaff[];
  jobIds: IJob[];
  countStaff: number;
  status: TRICK_STATUS;
  description: string;
  isDeleted: IS_DELETED;
}

export type CreateTrick = {
  name: string;
  time: number;
  staffIds: string[];
  jobIds: string[];
  countStaff: number;
  status: TRICK_STATUS;
  description: string;
};

export default ITrick;
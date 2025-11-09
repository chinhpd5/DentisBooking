import { IS_DELETED, SERVICE_STATUS, SERVICE_TYPE } from "../contants";
import IJob from "./job";
import { IStaff } from "./staff";

interface IService {
  _id: string;
  name: string;
  time: number;
  type: SERVICE_TYPE;
  isFirst?: boolean;
  jobIds?: IJob[];
  staffIds?: IStaff[];
  countStaff?: number;
  status: SERVICE_STATUS;
  isDeleted: IS_DELETED;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IService;
import { IS_DELETED,JOB_STATUS } from "../contants";

interface IJob {
  _id: string;
  name: string;
  time: number;
  isFirst: boolean;
  description: string;
  status: JOB_STATUS;
  isDeleted: IS_DELETED;
}

export default IJob;
export type CreateJob = Omit<IJob, "_id" | "isDeleted">;
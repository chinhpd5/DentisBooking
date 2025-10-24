export interface IShift {
  start: number; // phút từ 0 - 1439
  end: number;   // phút từ 0 - 1439
}

import { USER_ROLE, STAFF_STATUS, IS_DELETED } from '../contants/index';
export interface IStaff {
  _id: string;
  name: string;
  phone: string;
  role: USER_ROLE;
  email?: string;
  scheduleMonday?: IShift[];
  scheduleTuesday?: IShift[];
  scheduleWednesday?: IShift[];
  scheduleThursday?: IShift[];
  scheduleFriday?: IShift[];
  scheduleSaturday?: IShift[];
  scheduleSunday?: IShift[];
  status: STAFF_STATUS;
  isDeleted: IS_DELETED;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateStaff = Omit<IStaff, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>;
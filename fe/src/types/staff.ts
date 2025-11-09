import { USER_ROLE, STAFF_STATUS, IS_DELETED } from '../contants/index';

export interface IShift {
  start: number; // phút từ 0 - 1439
  end: number;   // phút từ 0 - 1439
}

export interface IDaySchedule {
  morning: IShift;
  afternoon: IShift;
}

export interface IStaff {
  _id: string;
  name: string;
  phone: string;
  role: USER_ROLE;
  email?: string;
  scheduleMonday?: IDaySchedule;
  scheduleTuesday?: IDaySchedule;
  scheduleWednesday?: IDaySchedule;
  scheduleThursday?: IDaySchedule;
  scheduleFriday?: IDaySchedule;
  scheduleSaturday?: IDaySchedule;
  scheduleSunday?: IDaySchedule;
  status: STAFF_STATUS;
  isDeleted: IS_DELETED;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateStaff = Omit<IStaff, '_id' | 'isDeleted' | 'createdAt' | 'updatedAt'>;
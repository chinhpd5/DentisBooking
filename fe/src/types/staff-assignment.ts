import { IStaff } from "./staff";
import IService from "./service";
import IBooking from "./booking";

interface IStaffAssignment {
  _id: string;
  staffId: IStaff;
  serviceIds: IService[];
  timeStart: Date;
  timeEnd: Date;
  bookingId?: IBooking | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IStaffAssignment;


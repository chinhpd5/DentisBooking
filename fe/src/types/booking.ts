import { BOOKING_STATUS, IS_DELETED, SERVICE_TYPE } from "../contants";
import ICustomer from "./customer";
import IService from "./service";
import { IStaff } from "./staff";

interface IBookingStaffAssignment {
  staffId: IStaff;
  serviceIds: IService[];
  timeStart: Date;
  timeEnd: Date;
}

interface IBooking {
  _id: string;
  customerId: ICustomer;
  note: string;
  appointmentDate: Date;
  timeEnd: Date;
  doctorDate?: Date;
  priority: boolean;
  comingTime?: Date;
  doingTime?: Date;
  completeTime?: Date;
  doctorId?: IStaff;
  serviceId: IService;
  type?: SERVICE_TYPE;
  status: BOOKING_STATUS;
  isDeleted: IS_DELETED;
  staffAssignments?: IBookingStaffAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export default IBooking;
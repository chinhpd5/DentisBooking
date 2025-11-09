import IBooking from "./booking";
import { IStaff } from "./staff";

interface IBookingStaff {
  _id: string;
  bookingId?: IBooking | string;
  staffId: IStaff;
}

export default IBookingStaff;
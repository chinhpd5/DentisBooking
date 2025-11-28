import { SEAT_STATUS } from "../contants";
import ISeat from "./seat";
import IUser from "./user";

type SeatRef = ISeat | string;
type UserRef = IUser | string | null;

interface INotification {
  _id: string;
  seatId: SeatRef;
  seatName: string;
  changedBy: UserRef;
  fromStatus: SEAT_STATUS;
  toStatus: SEAT_STATUS;
  createdAt: string;
}

export default INotification;


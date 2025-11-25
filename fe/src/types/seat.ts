import { IS_DELETED, SEAT_STATUS } from "../contants";
import ILocation from "./location";
import ITrick from "./trick";

interface ISeat {
  _id: string;
  name: string;
  status: SEAT_STATUS;
  description: string;
  trickIds: ITrick[];
  isDeleted: IS_DELETED;
  locationId: ILocation;
}

export type CreateSeat = {
  name: string;
  status: SEAT_STATUS;
  description: string;
  locationId?: string;
};

export default ISeat;
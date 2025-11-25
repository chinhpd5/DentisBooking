export default interface ILocation {
  _id: string;
  name: string;
  description: string;
}

export type CreateLocation = Omit<ILocation, "_id">;

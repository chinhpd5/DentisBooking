interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  yearOfBirth?: number;
  gender: string;
  note: string;
}

export default ICustomer;
export type CreateCustomer = Omit<ICustomer, "_id">;
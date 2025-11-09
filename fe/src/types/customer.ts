interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  gender: string;
  note: string;
}

export default ICustomer;
export type CreateCustomer = Omit<ICustomer, "_id">;
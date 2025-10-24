interface IData<T> {
  currentPage: number,
  data: T[],
  limit: number,
  success: boolean,
  totalDocs: number,
  totalPages: number
}

export default IData;